import { relations } from "drizzle-orm";
import { coupons } from "../tables/coupons";
import { customers } from "../tables/customers";
import { promotionCodes } from "../tables/promotion-codes";

export const promotionCodesRelations = relations(promotionCodes, ({ one }) => ({
  coupon: one(coupons, {
    fields: [promotionCodes.couponId],
    references: [coupons.id],
  }),
  customer: one(customers, {
    fields: [promotionCodes.customerId],
    references: [customers.id],
  }),
}));
