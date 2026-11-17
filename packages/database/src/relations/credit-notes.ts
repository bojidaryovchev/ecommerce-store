import { relations } from "drizzle-orm";
import { creditNotes, customers, invoices } from "../tables";

export const creditNotesRelations = relations(creditNotes, ({ one }) => ({
  customer: one(customers, {
    fields: [creditNotes.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [creditNotes.invoiceId],
    references: [invoices.id],
  }),
}));
