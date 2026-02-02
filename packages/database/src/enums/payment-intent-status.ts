import { pgEnum } from "drizzle-orm/pg-core";

export const paymentIntentStatusEnum = pgEnum("payment_intent_status", [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "requires_capture",
  "canceled",
  "succeeded",
]);
