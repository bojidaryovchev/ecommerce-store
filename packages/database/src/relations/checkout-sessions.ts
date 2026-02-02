import { relations } from "drizzle-orm";
import { checkoutSessions } from "../tables/checkout-sessions";
import { customers } from "../tables/customers";
import { invoices } from "../tables/invoices";
import { paymentIntents } from "../tables/payment-intents";
import { setupIntents } from "../tables/setup-intents";
import { subscriptions } from "../tables/subscriptions";

export const checkoutSessionsRelations = relations(checkoutSessions, ({ one }) => ({
  customer: one(customers, {
    fields: [checkoutSessions.customerId],
    references: [customers.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [checkoutSessions.paymentIntentId],
    references: [paymentIntents.id],
  }),
  subscription: one(subscriptions, {
    fields: [checkoutSessions.subscriptionId],
    references: [subscriptions.id],
  }),
  invoice: one(invoices, {
    fields: [checkoutSessions.invoiceId],
    references: [invoices.id],
  }),
  setupIntent: one(setupIntents, {
    fields: [checkoutSessions.setupIntentId],
    references: [setupIntents.id],
  }),
}));
