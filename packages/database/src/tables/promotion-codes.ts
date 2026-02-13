import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { coupons } from "./coupons";
import { customers } from "./customers";

export const promotionCodes = pgTable("promotion_code", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePromotionCodeId: text("stripe_promotion_code_id").unique(),
  object: text("object").default("promotion_code"),
  code: text("code").notNull().unique(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").default(0).notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  promotion: jsonb("promotion")
    .$type<{
      coupon?: Record<string, unknown>;
    }>()
    .notNull()
    .default({}),
  restrictions: jsonb("restrictions").$type<{
    firstTimeTransaction?: boolean;
    minimumAmount?: number;
    minimumAmountCurrency?: string;
  }>(),
  customerId: text("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  livemode: boolean("livemode").default(false).notNull(),
  customerAccount: text("customer_account"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
