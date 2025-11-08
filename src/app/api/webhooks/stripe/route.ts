import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
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
    // If event already exists (duplicate webhook), return success
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      console.log(`Duplicate webhook event ${event.id}, skipping`);
      return NextResponse.json({ received: true });
    }
    console.error("Error logging webhook event:", error);
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

    // Log the error
    await prisma.webhookEvent.update({
      where: { stripeEventId: event.id },
      data: {
        processingError: error instanceof Error ? error.message : "Unknown error",
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
    data: { status: "FAILED" },
  });
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent succeeded: ${paymentIntent.id}`);

  // Update order status if exists
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: "COMPLETED" },
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`PaymentIntent failed: ${paymentIntent.id}`);

  // Update order status if exists
  await prisma.order.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: "FAILED" },
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
  let userId: string | undefined;

  if (customerEmail) {
    const user = await prisma.user.findUnique({
      where: { email: customerEmail },
    });
    userId = user?.id;
  }

  // Check if order already exists
  const existingOrder = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });

  if (existingOrder) {
    // Update existing order
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        userId,
        status: "COMPLETED",
        stripePaymentIntentId: session.payment_intent as string,
        metadata: session.metadata ? JSON.parse(JSON.stringify(session.metadata)) : null,
      },
    });
    return;
  }

  // Create new order with items
  await prisma.order.create({
    data: {
      userId,
      customerEmail,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent as string,
      status: "COMPLETED",
      currency: session.currency || "usd",
      subtotal,
      tax,
      total,
      shippingAddress: session.shipping_cost ? JSON.parse(JSON.stringify(session.shipping_cost)) : null,
      billingAddress: session.customer_details ? JSON.parse(JSON.stringify(session.customer_details)) : null,
      metadata: session.metadata ? JSON.parse(JSON.stringify(session.metadata)) : null,
      items: {
        create: await Promise.all(
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
            const product = await prisma.product.findUnique({
              where: {
                stripeProductId: productId,
              },
            });

            // Find our database price by stripe price id
            const price = await prisma.price.findUnique({
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
        ),
      },
    },
  });

  // Clear the cart if cartId is in metadata
  const cartId = session.metadata?.cartId;
  if (cartId) {
    try {
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
