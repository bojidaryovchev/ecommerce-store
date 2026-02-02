import { relations } from "drizzle-orm";
import { customers } from "../tables/customers";
import { discounts } from "../tables/discounts";
import { invoices } from "../tables/invoices";
import { subscriptionItems } from "../tables/subscription-items";
import { subscriptions } from "../tables/subscriptions";

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [subscriptions.customerId],
    references: [customers.id],
  }),
  subscriptionItems: many(subscriptionItems),
  invoices: many(invoices),
  discounts: many(discounts),
}));
