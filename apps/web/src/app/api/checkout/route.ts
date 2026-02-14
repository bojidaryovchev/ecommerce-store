import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import { stripe } from "@/lib/stripe";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
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
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // Validate stock for all items with inventory tracking
    for (const item of cart.items) {
      if (item.product.trackInventory) {
        if (item.product.stockQuantity === null || item.product.stockQuantity < item.quantity) {
          const available = item.product.stockQuantity ?? 0;
          return NextResponse.json(
            {
              error: `"${item.product.name}" ${available === 0 ? "is out of stock" : `only has ${available} in stock (requested ${item.quantity})`}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Build line items with inline price_data
    const lineItems = cart.items.map((item) => {
      const unitAmount = item.price.unitAmount ?? 0;
      const productImage = item.product.images?.[0];

      return {
        price_data: {
          currency: item.price.currency,
          unit_amount: unitAmount,
          product_data: {
            name: item.product.name,
            description: item.product.description ?? undefined,
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

    // Get the origin for success/cancel URLs
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      customer_email: session?.user?.email ?? undefined,
      metadata: {
        cartId: cart.id,
        userId: session?.user?.id ?? "",
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "NL", "BE"],
      },
      billing_address_collection: "required",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Checkout failed" }, { status: 500 });
  }
}
