import { relations } from "drizzle-orm";
import { creditNotes } from "../tables/credit-notes";
import { customers } from "../tables/customers";
import { invoiceItems } from "../tables/invoice-items";
import { invoiceLineItems } from "../tables/invoice-line-items";
import { invoices } from "../tables/invoices";
import { paymentIntents } from "../tables/payment-intents";
import { subscriptions } from "../tables/subscriptions";

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [invoices.paymentIntentId],
    references: [paymentIntents.id],
  }),
  invoiceLineItems: many(invoiceLineItems),
  invoiceItems: many(invoiceItems),
  creditNotes: many(creditNotes),
}));
