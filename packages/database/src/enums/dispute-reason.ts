import { pgEnum } from "drizzle-orm/pg-core";

export const disputeReasonEnum = pgEnum("dispute_reason", [
  "bank_cannot_process",
  "check_returned",
  "credit_not_processed",
  "customer_initiated",
  "debit_not_authorized",
  "duplicate",
  "fraudulent",
  "general",
  "incorrect_account_details",
  "insufficient_funds",
  "noncompliant",
  "product_not_received",
  "product_unacceptable",
  "subscription_canceled",
  "unrecognized",
]);
