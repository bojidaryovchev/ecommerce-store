import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

/**
 * Server-side Stripe instance
 * Used for creating payment intents, handling webhooks, refunds, etc.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});

/**
 * Get Stripe publishable key for client-side
 * This is safe to expose to the client
 */
export function getStripePublishableKey(): string {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined in environment variables");
  }
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}
