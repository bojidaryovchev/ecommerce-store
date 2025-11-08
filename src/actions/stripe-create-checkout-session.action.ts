"use server";

import { isRuntimeEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { headers } from "next/headers";

interface CheckoutSessionParams {
  priceId: string;
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export async function stripeCreateCheckoutSession(
  params: CheckoutSessionParams,
): Promise<ActionResult<{ sessionId: string; url: string }>> {
  try {
    const readonlyHeaders = await headers();
    const host = readonlyHeaders.get("host");
    const protocol = isRuntimeEnv("development") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const {
      priceId,
      quantity = 1,
      successUrl = `${baseUrl}/success`,
      cancelUrl = `${baseUrl}/cancel`,
      customerEmail,
      metadata,
    } = params;

    // Validate that the price exists in database and is active
    const price = await prisma.price.findUnique({
      where: { stripePriceId: priceId },
      include: { product: true },
    });

    if (!price) {
      return {
        success: false,
        error: "Price not found",
      };
    }

    if (!price.active || price.deletedAt) {
      return {
        success: false,
        error: "Price is not available",
      };
    }

    if (!price.product.active || price.product.deletedAt) {
      return {
        success: false,
        error: "Product is not available",
      };
    }

    // Create checkout session with idempotency key to prevent duplicate sessions
    // Use combination of priceId and timestamp for uniqueness
    const idempotencyKey = `checkout-direct-${priceId}-${metadata?.idempotencyToken || Date.now()}`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: customerEmail,
        metadata,
        payment_intent_data: {
          metadata,
        },
        currency: STRIPE_CONFIG.currency,
      },
      {
        idempotencyKey,
      },
    );

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
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}
