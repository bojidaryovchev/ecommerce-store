import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { couponDurationEnum } from "../enums";

export const coupons = pgTable("coupon", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeCouponId: text("stripe_coupon_id").unique(),
  object: text("object").default("coupon"),
  percentOff: integer("percent_off"),
  amountOff: integer("amount_off"),
  currency: text("currency"),
  duration: couponDurationEnum("duration").notNull(),
  durationInMonths: integer("duration_in_months"),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").default(0).notNull(),
  redeemBy: timestamp("redeem_by", { mode: "date" }),
  appliesTo: jsonb("applies_to").$type<{
    products?: string[];
  }>(),
  valid: boolean("valid").default(true).notNull(),
  name: text("name"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  livemode: boolean("livemode").default(false).notNull(),
  currencyOptions: jsonb("currency_options").$type<
    Record<
      string,
      {
        amountOff?: number;
      }
    >
  >(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
