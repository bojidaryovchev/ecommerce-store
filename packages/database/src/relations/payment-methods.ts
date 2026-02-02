import { relations } from "drizzle-orm";
import { customers } from "../tables/customers";
import { paymentMethods } from "../tables/payment-methods";

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  customer: one(customers, {
    fields: [paymentMethods.customerId],
    references: [customers.id],
  }),
}));
