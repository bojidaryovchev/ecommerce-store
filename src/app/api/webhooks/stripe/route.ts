import { generateOrderNumber } from "@/lib/order-number";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { mapStripePaymentStatus } from "@/lib/stripe-mapping";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error("⚠️  Webhook signature verification failed.", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Log the event to database for debugging and idempotency
  try {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        data: JSON.parse(JSON.stringify(event.data)),
        processed: false,
      },
    });
  } catch (error) {
    // If event already exists (duplicate webhook), return success immediately
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      console.log(`Duplicate webhook event ${event.id}, skipping processing`);
      return NextResponse.json({ received: true });
    }
    console.error("Error logging webhook event:", error);
    // Continue processing even if logging fails for other reasons
  }

  try {
    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.async_payment_succeeded":
        await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
        break;

      case "checkout.session.async_payment_failed":
        await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error processing webhook event ${event.id}:`, error);

    // Increment retry count and log the error
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processingError: error instanceof Error ? error.message : "Unknown error",
        retryCount: {
          increment: 1,
        },
        lastAttemptAt: new Date(),
      },
    });

    // Still return 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log(`Checkout session completed: ${session.id}`);

  // For immediate payments, create/update order
  if (session.payment_status === "paid") {
    await createOrUpdateOrder(session);
  }
}

async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log(`Async payment succeeded for session: ${session.id}`);
  await createOrUpdateOrder(session);
}

async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log(`Async payment failed for session: ${session.id}`);

  // Update order status to failed
  await prisma.order.updateMany({
    where: { stripeCheckoutSessionId: session.id },
    data: {
      status: "FAILED",
      paymentStatus: "FAILED",
    },
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

  // Update order status if exists
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "COMPLETED",
      paymentStatus: "PAID",
    },
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent failed: ${paymentIntent.id}`);

  // Update order status if exists
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "FAILED",
      paymentStatus: "FAILED",
    },
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`Charge refunded: ${charge.id}`);

  const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) {
    console.warn(`No payment intent found for charge ${charge.id}`);
    return;
  }

  // Determine if full or partial refund
  const isFullRefund = charge.amount_refunded === charge.amount;
  const paymentStatus = isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED";

  // Get refund reason from the latest refund
  const refundReason = charge.refunds?.data[0]?.reason || null;

  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntentId },
    data: {
      paymentStatus,
      refundedAmount: charge.amount_refunded,
      refundReason,
    },
  });
}

async function createOrUpdateOrder(session: Stripe.Checkout.Session) {
  // Retrieve the session with line items
  const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const lineItems = sessionWithLineItems.line_items?.data || [];

  if (lineItems.length === 0) {
    console.warn(`No line items found for session ${session.id}`);
    return;
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => {
    return sum + (item.amount_subtotal || 0);
  }, 0);

  const tax = lineItems.reduce((sum, item) => {
    return sum + (item.amount_tax || 0);
  }, 0);

  const total = session.amount_total || 0;

  // Find user by email if provided
  const customerEmail = session.customer_details?.email || session.customer_email;
  let userId: string | null = null;

  if (customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });
    userId = user?.id || null;

    // Link Stripe customer to user if not already linked
    if (user && session.customer) {
      const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;

      // Use updateMany with conditional where to prevent race conditions
      // Only update if stripeCustomerId is still null (atomic operation)
      if (!user.stripeCustomerId) {
        const result = await prisma.user.updateMany({
          where: {
            id: user.id,
            stripeCustomerId: null, // Only update if still null
          },
          data: { stripeCustomerId: customerId },
        });

        if (result.count === 0) {
          console.log(`stripeCustomerId already set for user ${user.id} by another webhook`);
        }
      }
    }
  }

  // Map Stripe payment status to our enum
  const paymentStatus = mapStripePaymentStatus(session.payment_status || "unpaid");

  // Generate unique order number (only used for new orders)
  const orderNumber = await generateOrderNumber();

  // Wrap entire order creation in transaction for atomicity
  await prisma.$transaction(async (tx) => {
    // Prepare order items data
    const orderItemsData = await Promise.all(
      lineItems.map(async (item) => {
        // Extract product and price information
        const priceId = typeof item.price?.id === "string" ? item.price.id : "";

        let productId = "";
        if (typeof item.price?.product === "string") {
          productId = item.price.product;
        } else if (typeof item.price?.product === "object" && item.price.product !== null) {
          const productObj = item.price.product as Stripe.Product;
          productId = productObj.id;
        }

        // Find our database product by stripe product id
        const product = await tx.product.findUnique({
          where: {
            stripeProductId: productId,
          },
        });

        // Find our database price by stripe price id
        const price = await tx.price.findUnique({
          where: {
            stripePriceId: priceId,
          },
        });

        if (!product || !price) {
          throw new Error(`Product or price not found for stripe IDs: ${productId}, ${priceId}`);
        }

        return {
          productId: product.id,
          priceId: price.id,
          quantity: item.quantity || 1,
          unitAmount: item.price?.unit_amount || 0,
        };
      }),
    );

    // Use upsert to handle race conditions from concurrent webhooks atomically
    // Multiple webhooks (checkout.session.completed + payment_intent.succeeded) may fire simultaneously
    await tx.order.upsert({
      where: { stripeCheckoutSessionId: session.id },
      update: {
        // Update existing order with latest payment information
        ...(userId && { userId }),
        status: "COMPLETED",
        paymentStatus,
        stripePaymentIntentId: (session.payment_intent as string) || null,
        metadata: session.metadata ? JSON.parse(JSON.stringify(session.metadata)) : null,
      },
      create: {
        // Create new order with all details
        orderNumber,
        ...(userId && { userId }),
        customerEmail: customerEmail || null,
        customerName: session.customer_details?.name || null,
        customerPhone: session.customer_details?.phone || null,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: (session.payment_intent as string) || null,
        status: "COMPLETED",
        paymentStatus,
        fulfillmentStatus: "UNFULFILLED",
        currency: session.currency || "usd",
        subtotal,
        tax,
        total,
        shippingAddress:
          "shipping_details" in session && session.shipping_details
            ? JSON.parse(JSON.stringify(session.shipping_details))
            : null,
        billingAddress: session.customer_details?.address
          ? JSON.parse(JSON.stringify(session.customer_details.address))
          : null,
        metadata: session.metadata ? JSON.parse(JSON.stringify(session.metadata)) : null,
        items: {
          create: orderItemsData,
        },
      },
    });
  });

  // Clear the cart if cartId is in metadata
  const cartId = session.metadata?.cartId;
  if (cartId) {
    try {
      // Validate cartId format (MongoDB ObjectId is 24 hex characters)
      if (!/^[0-9a-fA-F]{24}$/.test(cartId)) {
        console.warn(`Invalid cartId format in metadata: ${cartId}`);
        return;
      }

      // Verify cart exists and is in CHECKED_OUT status before deletion
      const cart = await prisma.cart.findUnique({
        where: { id: cartId },
        select: { id: true, status: true },
      });

      if (!cart) {
        console.warn(`Cart ${cartId} not found, may have already been deleted`);
        return;
      }

      if (cart.status !== "CHECKED_OUT") {
        console.warn(`Cart ${cartId} status is ${cart.status}, expected CHECKED_OUT. Skipping deletion.`);
        return;
      }

      await prisma.cart.delete({
        where: { id: cartId },
      });
      console.log(`Cart ${cartId} deleted after successful order`);
    } catch (error) {
      console.error(`Failed to delete cart ${cartId}:`, error);
      // Don't fail the order creation if cart deletion fails
    }
  }

  console.log(`Order created for session: ${session.id}`);
}
