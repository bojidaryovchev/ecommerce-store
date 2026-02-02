import { relations } from "drizzle-orm";
import { balanceTransactions } from "../tables/balance-transactions";
import { charges } from "../tables/charges";
import { customers } from "../tables/customers";
import { disputes } from "../tables/disputes";
import { paymentIntents } from "../tables/payment-intents";
import { refunds } from "../tables/refunds";

export const chargesRelations = relations(charges, ({ one, many }) => ({
  customer: one(customers, {
    fields: [charges.customerId],
    references: [customers.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [charges.paymentIntentId],
    references: [paymentIntents.id],
  }),
  balanceTransaction: one(balanceTransactions, {
    fields: [charges.balanceTransactionId],
    references: [balanceTransactions.id],
  }),
  refunds: many(refunds),
  disputes: many(disputes),
}));
