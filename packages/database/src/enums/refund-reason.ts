import { pgEnum } from "drizzle-orm/pg-core";

export const refundReasonEnum = pgEnum("refund_reason", [
  "duplicate",
  "fraudulent",
  "requested_by_customer",
  "expired_uncaptured_charge",
]);
