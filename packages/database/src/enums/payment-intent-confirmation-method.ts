import { pgEnum } from "drizzle-orm/pg-core";

export const paymentIntentConfirmationMethodEnum = pgEnum("payment_intent_confirmation_method", [
  "automatic",
  "manual",
]);
