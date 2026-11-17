import { relations } from "drizzle-orm";
import { invoiceLineItems } from "../tables/invoice-line-items";
import { invoices } from "../tables/invoices";
import { subscriptions } from "../tables/subscriptions";

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoiceLineItems.subscriptionId],
    references: [subscriptions.id],
  }),
}));
