import { relations } from "drizzle-orm";
import { checkoutSessions } from "../tables/checkout-sessions";
import { customers } from "../tables/customers";
import { discounts } from "../tables/discounts";
import { invoices } from "../tables/invoices";
import { subscriptionItems } from "../tables/subscription-items";
import { subscriptions } from "../tables/subscriptions";

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  latestInvoice: one(invoices, {
    fields: [subscriptions.latestInvoiceId],
    references: [invoices.id],
  }),
  subscriptionItems: many(subscriptionItems),
  invoices: many(invoices),
  discounts: many(discounts),
  checkoutSessions: many(checkoutSessions),
}));
