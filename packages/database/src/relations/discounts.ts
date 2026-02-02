import { relations } from "drizzle-orm";
import { coupons } from "../tables/coupons";
import { customers } from "../tables/customers";
import { discounts } from "../tables/discounts";
import { promotionCodes } from "../tables/promotion-codes";
import { subscriptions } from "../tables/subscriptions";

export const discountsRelations = relations(discounts, ({ one }) => ({
  coupon: one(coupons, {
    fields: [discounts.couponId],
    references: [coupons.id],
  }),
  customer: one(customers, {
    fields: [discounts.customerId],
    references: [customers.id],
  }),
  promotionCode: one(promotionCodes, {
    fields: [discounts.promotionCodeId],
    references: [promotionCodes.id],
  }),
  subscription: one(subscriptions, {
    fields: [discounts.subscriptionId],
    references: [subscriptions.id],
  }),
}));
