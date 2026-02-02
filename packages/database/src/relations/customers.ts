import { relations } from "drizzle-orm";
import { customers } from "../tables/customers";
import { discounts } from "../tables/discounts";
import { paymentIntents } from "../tables/payment-intents";
import { paymentMethods } from "../tables/payment-methods";
import { subscriptions } from "../tables/subscriptions";
import { taxIds } from "../tables/tax-ids";

export const customersRelations = relations(customers, ({ many }) => ({
  paymentIntents: many(paymentIntents),
  paymentMethods: many(paymentMethods),
  subscriptions: many(subscriptions),
  taxIds: many(taxIds),
  discounts: many(discounts),
}));
