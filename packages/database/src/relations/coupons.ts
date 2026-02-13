import { relations } from "drizzle-orm";
import { coupons } from "../tables/coupons";
import { discounts } from "../tables/discounts";
import { promotionCodes } from "../tables/promotion-codes";

export const couponsRelations = relations(coupons, ({ many }) => ({
  promotionCodes: many(promotionCodes),
  discounts: many(discounts),
}));
