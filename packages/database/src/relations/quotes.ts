import { relations } from "drizzle-orm";
import { customers, invoices, quotes, subscriptions } from "../tables";

export const quotesRelations = relations(quotes, ({ one }) => ({
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [quotes.invoiceId],
    references: [invoices.id],
  }),
  subscription: one(subscriptions, {
    fields: [quotes.subscriptionId],
    references: [subscriptions.id],
  }),
}));
