import { pgEnum } from "drizzle-orm/pg-core";

export const paymentIntentCaptureMethodEnum = pgEnum("payment_intent_capture_method", [
  "automatic",
  "automatic_async",
  "manual",
]);
