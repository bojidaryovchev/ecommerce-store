import { relations } from "drizzle-orm";
import { charges } from "../tables/charges";
import { customers } from "../tables/customers";
import { invoices } from "../tables/invoices";
import { paymentIntents } from "../tables/payment-intents";

export const paymentIntentsRelations = relations(paymentIntents, ({ one, many }) => ({
  customer: one(customers, {
    fields: [paymentIntents.customerId],
    references: [customers.id],
  }),
  invoice: one(invoices, {
    fields: [paymentIntents.invoiceId],
    references: [invoices.id],
  }),
  charges: many(charges),
}));
