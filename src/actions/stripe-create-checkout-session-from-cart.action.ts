"use server";

import { isRuntimeEnv } from "@/lib/env";
import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { headers } from "next/headers";

interface CheckoutSessionFromCartParams {
  cartId: string;
  userId?: string;
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
      userId,
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

    // Validate all products and prices are active and available
    for (const item of cart.items) {
      if (!item.product.active || item.product.deletedAt) {
        return {
          success: false,
          error: `Product "${item.product.name}" is no longer available`,
        };
      }
      if (!item.price.active || item.price.deletedAt) {
        return {
          success: false,
          error: `Price for "${item.product.name}" is no longer available`,
        };
      }
      if (!item.price.stripePriceId) {
        return {
          success: false,
          error: `Product "${item.product.name}" is not configured for checkout`,
        };
      }
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

    // Handle Stripe customer creation/linking
    let stripeCustomerId: string | undefined;

    if (userId) {
      // Get user's existing Stripe customer ID
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { stripeCustomerId: true, email: true },
      });

      if (user?.stripeCustomerId) {
        stripeCustomerId = user.stripeCustomerId;
      } else {
        // Create Stripe customer for first-time user
        const customer = await stripe.customers.create({
          email: user?.email || customerEmail || undefined,
          metadata: { userId },
        });

        // Save to database
        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId: customer.id },
        });

        stripeCustomerId = customer.id;
      }
    }

    // Create checkout session with idempotency key to prevent duplicate sessions
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...(stripeCustomerId ? { customer: stripeCustomerId } : customerEmail ? { customer_email: customerEmail } : {}),
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
      },
      {
        idempotencyKey: `checkout-cart-${cartId}`,
      },
    );

    if (!session.url) {
      return {
        success: false,
        error: "Failed to create checkout session URL",
      };
    }

    // Update cart status to CHECKED_OUT and activity timestamp
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        status: "CHECKED_OUT",
        lastActivityAt: new Date(),
      },
    });

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
      error: sanitizeError(error, ErrorMessages.CHECKOUT_FAILED),
    };
  }
}
