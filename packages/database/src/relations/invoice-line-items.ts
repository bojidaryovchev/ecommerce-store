import { relations } from "drizzle-orm";
import { invoiceLineItems } from "../tables/invoice-line-items";
import { invoices } from "../tables/invoices";
import { subscriptionItems } from "../tables/subscription-items";

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
  subscriptionItem: one(subscriptionItems, {
    fields: [invoiceLineItems.subscriptionItemId],
    references: [subscriptionItems.id],
  }),
}));
