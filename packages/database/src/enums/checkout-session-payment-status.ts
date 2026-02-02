import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutSessionPaymentStatusEnum = pgEnum("checkout_session_payment_status", [
  "paid",
  "unpaid",
  "no_payment_required",
]);
