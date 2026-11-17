import { relations } from "drizzle-orm";
import { customers } from "../tables/customers";
import { invoiceItems } from "../tables/invoice-items";
import { invoices } from "../tables/invoices";

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  customer: one(customers, {
    fields: [invoiceItems.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));
