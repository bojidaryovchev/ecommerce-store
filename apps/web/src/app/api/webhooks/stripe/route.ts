import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session expired:", session.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const cartId = session.metadata?.cartId;
  const userId = session.metadata?.userId || null;

  if (!cartId) {
    console.error("No cartId in session metadata");
    return;
  }

  // Get cart with items
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.id, cartId),
    with: {
      items: {
        with: {
          product: true,
          price: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) {
    console.error("Cart not found or empty:", cartId);
    return;
  }

  // Calculate totals
  const subtotalAmount = cart.items.reduce((sum, item) => {
    return sum + (item.price.unitAmount ?? 0) * item.quantity;
  }, 0);

  // Get shipping address from Stripe session (v20: under collected_information)
  const shippingDetails = session.collected_information?.shipping_details;
  const shippingAddress = shippingDetails?.address
    ? {
        name: shippingDetails.name ?? "",
        line1: shippingDetails.address.line1 ?? "",
        line2: shippingDetails.address.line2 ?? undefined,
        city: shippingDetails.address.city ?? "",
        state: shippingDetails.address.state ?? undefined,
        postalCode: shippingDetails.address.postal_code ?? "",
        country: shippingDetails.address.country ?? "",
      }
    : undefined;

  // Get billing address
  const customerDetails = session.customer_details;
  const billingAddress = customerDetails?.address
    ? {
        name: customerDetails.name ?? "",
        line1: customerDetails.address.line1 ?? "",
        line2: customerDetails.address.line2 ?? undefined,
        city: customerDetails.address.city ?? "",
        state: customerDetails.address.state ?? undefined,
        postalCode: customerDetails.address.postal_code ?? "",
        country: customerDetails.address.country ?? "",
        phone: customerDetails.phone ?? undefined,
      }
    : undefined;

  // Create order
  const [order] = await db
    .insert(schema.orders)
    .values({
      stripePaymentIntentId: session.payment_intent as string,
      stripeCheckoutSessionId: session.id,
      userId: userId || null,
      guestEmail: customerDetails?.email ?? null,
      status: "paid",
      currency: session.currency ?? "usd",
      subtotalAmount,
      discountAmount: 0,
      shippingAmount: session.shipping_cost?.amount_total ?? 0,
      taxAmount: session.total_details?.amount_tax ?? 0,
      totalAmount: session.amount_total ?? subtotalAmount,
      shippingAddress,
      billingAddress,
      paidAt: new Date(),
    })
    .returning();

  // Create order items with snapshots
  const orderItems = cart.items.map((item) => ({
    orderId: order.id,
    productId: item.product.id,
    priceId: item.price.id,
    productSnapshot: {
      name: item.product.name,
      description: item.product.description ?? undefined,
      images: item.product.images ?? undefined,
    },
    priceSnapshot: {
      unitAmount: item.price.unitAmount ?? 0,
      currency: item.price.currency,
    },
    quantity: item.quantity,
    totalAmount: (item.price.unitAmount ?? 0) * item.quantity,
  }));

  await db.insert(schema.orderItems).values(orderItems);

  // Clear the cart
  await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cartId));

  // Invalidate order cache so success page can find the new order
  revalidateTag(CACHE_TAGS.orders, "max");
  revalidateTag(`checkout-session:${session.id}`, "max");
  if (userId) {
    revalidateTag(CACHE_TAGS.ordersByUser(userId), "max");
  }

  console.log("Order created:", order.id);
}
