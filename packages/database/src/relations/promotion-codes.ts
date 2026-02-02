import { relations } from "drizzle-orm";
import { coupons } from "../tables/coupons";
import { promotionCodes } from "../tables/promotion-codes";
import { users } from "../tables/users";

export const promotionCodesRelations = relations(promotionCodes, ({ one }) => ({
  coupon: one(coupons, {
    fields: [promotionCodes.couponId],
    references: [coupons.id],
  }),
  customer: one(users, {
    fields: [promotionCodes.customerId],
    references: [users.id],
  }),
}));
