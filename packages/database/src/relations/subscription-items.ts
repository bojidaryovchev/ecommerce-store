import { relations } from "drizzle-orm";
import { prices } from "../tables/prices";
import { subscriptionItems } from "../tables/subscription-items";
import { subscriptions } from "../tables/subscriptions";

export const subscriptionItemsRelations = relations(subscriptionItems, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionItems.subscriptionId],
    references: [subscriptions.id],
  }),
  price: one(prices, {
    fields: [subscriptionItems.priceId],
    references: [prices.id],
  }),
}));
