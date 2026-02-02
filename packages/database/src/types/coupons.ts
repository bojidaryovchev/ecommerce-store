import { coupons } from "../tables/coupons";

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
