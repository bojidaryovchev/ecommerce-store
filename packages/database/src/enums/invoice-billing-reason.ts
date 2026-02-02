import { pgEnum } from "drizzle-orm/pg-core";

export const invoiceBillingReasonEnum = pgEnum("invoice_billing_reason", [
  "automatic_pending_invoice_item_invoice",
  "manual",
  "quote_accept",
  "subscription",
  "subscription_create",
  "subscription_cycle",
  "subscription_threshold",
  "subscription_update",
  "upcoming",
]);
