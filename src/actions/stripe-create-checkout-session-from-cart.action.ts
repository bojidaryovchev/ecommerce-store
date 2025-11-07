"use server";

import { isRuntimeEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { headers } from "next/headers";

interface CheckoutSessionFromCartParams {
  cartId: string;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export async function stripeCreateCheckoutSessionFromCart(
  params: CheckoutSessionFromCartParams,
): Promise<ActionResult<{ sessionId: string; url: string }>> {
  try {
    const readonlyHeaders = await headers();
    const host = readonlyHeaders.get("host");
    const protocol = isRuntimeEnv("development") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const {
      cartId,
      successUrl = `${baseUrl}/success`,
      cancelUrl = `${baseUrl}/cancel`,
      customerEmail,
      metadata,
    } = params;

    // Fetch cart with items
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    if (!cart) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    if (cart.items.length === 0) {
      return {
        success: false,
        error: "Cart is empty",
      };
    }

    // Build line items for Stripe
    const lineItems = cart.items.map((item) => {
      if (!item.price.stripePriceId) {
        throw new Error(`Price ${item.priceId} does not have a Stripe price ID`);
      }

      return {
        price: item.price.stripePriceId,
        quantity: item.quantity,
      };
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        ...metadata,
        cartId,
      },
      payment_intent_data: {
        metadata: {
          ...metadata,
          cartId,
        },
      },
      currency: STRIPE_CONFIG.currency,
    });

    if (!session.url) {
      return {
        success: false,
        error: "Failed to create checkout session URL",
      };
    }

    return {
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    };
  } catch (error) {
    console.error("Error creating checkout session from cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}
