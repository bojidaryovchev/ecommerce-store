import { promotionCodes } from "../tables/promotion-codes";

export type PromotionCode = typeof promotionCodes.$inferSelect;
export type NewPromotionCode = typeof promotionCodes.$inferInsert;
