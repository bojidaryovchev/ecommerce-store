import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  currency: "usd",
  maxCheckoutSessionAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;
