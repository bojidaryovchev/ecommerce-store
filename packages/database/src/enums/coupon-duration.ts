import { pgEnum } from "drizzle-orm/pg-core";

export const couponDurationEnum = pgEnum("coupon_duration", ["forever", "once", "repeating"]);
