import { pgEnum } from "drizzle-orm/pg-core";

export const paymentIntentSetupFutureUsageEnum = pgEnum("payment_intent_setup_future_usage", [
  "on_session",
  "off_session",
]);
