import { relations } from "drizzle-orm";
import { creditNotes, customers, invoices, refunds } from "../tables";

export const creditNotesRelations = relations(creditNotes, ({ one }) => ({
  customer: one(customers, {
    fields: [creditNotes.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [creditNotes.invoiceId],
    references: [invoices.id],
  }),
  refund: one(refunds, {
    fields: [creditNotes.refundId],
    references: [refunds.id],
  }),
}));
