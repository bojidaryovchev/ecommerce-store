import { relations } from "drizzle-orm";
import { charges } from "../tables/charges";
import { customers } from "../tables/customers";
import { paymentIntents } from "../tables/payment-intents";

export const paymentIntentsRelations = relations(paymentIntents, ({ one, many }) => ({
  customer: one(customers, {
    fields: [paymentIntents.customerId],
    references: [customers.id],
  }),
  charges: many(charges),
}));
