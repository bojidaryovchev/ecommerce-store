"use server";

import { isRuntimeEnv } from "@/lib/env";
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

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
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
    console.error("Error creating checkout session:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create checkout session",
    };
  }
}
