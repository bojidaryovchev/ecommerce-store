import { pgEnum } from "drizzle-orm/pg-core";

export const setupIntentStatusEnum = pgEnum("setup_intent_status", [
  "requires_payment_method",
  "requires_confirmation",
  "requires_action",
  "processing",
  "canceled",
  "succeeded",
]);
