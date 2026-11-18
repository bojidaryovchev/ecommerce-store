import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import { deliveryFee } from "@/lib/delivery";
import { primaryPhoto } from "@/lib/product-media";
import { stripe } from "@/lib/stripe";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** A line for the checkout page: the meta description, or the text's first 160 characters cut at a word. */
function summaryOf(product: {
  description: string | null;
  metadata?: Record<string, string> | null;
}): string | undefined {
  const meta = product.metadata?.metaDescription?.trim();
  if (meta) return meta;
  const text = product.description?.replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 160);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 120)).trimEnd()}…`;
}

/**
 * Look up or create a Stripe Customer for the authenticated user.
 * Stores the `stripeCustomerId` on the user row for future checkouts.
 */
async function getOrCreateStripeCustomer(userId: string, email: string, name?: string | null) {
  // Check if user already has a Stripe Customer ID
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // Create a new Stripe Customer
  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });

  // Persist the Stripe Customer ID on the user
  await db.update(schema.users).set({ stripeCustomerId: customer.id }).where(eq(schema.users.id, userId));

  return customer.id;
}

export async function POST(request: NextRequest) {
  try {
    // The shopper's language: for the messages below, the return URLs and Stripe's page.
    const body = (await request.json().catch(() => ({}))) as { locale?: unknown };
    const locale = body.locale === "en" ? "en" : "bg";
    const localePrefix = locale === "en" ? "/en" : "";
    const t = await getTranslations({ locale, namespace: "cart.checkoutErrors" });
    const session = await auth();
    let cart;

    // Get the cart
    if (session?.user?.id) {
      cart = await getCartByUserId(session.user.id);
    } else {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
      if (sessionId) {
        cart = await getCartBySessionId(sessionId);
      }
    }

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: t("empty") }, { status: 400 });
    }

    // Validate stock for all items with inventory tracking
    for (const item of cart.items) {
      if (item.product.trackInventory) {
        if (item.product.stockQuantity === null || item.product.stockQuantity < item.quantity) {
          const available = item.product.stockQuantity ?? 0;
          return NextResponse.json(
            {
              error:
                available === 0
                  ? t("outOfStock", { name: item.product.name })
                  : t("notEnough", { name: item.product.name, available, requested: item.quantity }),
            },
            { status: 400 },
          );
        }
      }
    }

    // Build line items with inline price_data
    const lineItems = cart.items.map((item) => {
      const unitAmount = item.price.unitAmount ?? 0;
      const productImage = primaryPhoto(item.product);

      return {
        price_data: {
          currency: item.price.currency,
          unit_amount: unitAmount,
          product_data: {
            name: item.product.name,
            // One line under the name on Stripe's page: the shop's own meta description, or the start of the text.
            description: summaryOf(item.product),
            images: productImage ? [productImage] : undefined,
            metadata: {
              productId: item.product.id,
              priceId: item.price.id,
            },
          },
        },
        quantity: item.quantity,
      };
    });

    // Delivery: one option, free or the fee (lib/delivery.ts), which Stripe shows as its own line.
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price.unitAmount ?? 0) * item.quantity, 0);
    const fee = deliveryFee(subtotal);

    // Get the origin for success/cancel URLs, in the shopper's language (Bulgarian URLs have no prefix)
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    // Resolve Stripe Customer for authenticated users
    let stripeCustomerId: string | undefined;
    if (session?.user?.id && session.user.email) {
      stripeCustomerId = await getOrCreateStripeCustomer(session.user.id, session.user.email, session.user.name);
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}${localePrefix}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${localePrefix}/checkout/cancel`,
      locale,
      // Use Stripe Customer when available; fall back to email-only for guests
      ...(stripeCustomerId ? { customer: stripeCustomerId } : { customer_email: session?.user?.email ?? undefined }),
      allow_promotion_codes: true,
      metadata: {
        cartId: cart.id,
        userId: session?.user?.id ?? "",
        // The emails about this order are written in this language.
        locale,
      },
      // We deliver and install in Bulgaria only.
      shipping_address_collection: {
        allowed_countries: ["BG"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: fee, currency: cart.items[0]?.price.currency ?? "eur" },
            display_name: fee > 0 ? t("delivery") : t("freeDelivery"),
          },
        },
      ],
      billing_address_collection: "required",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 500 });
  }
}
