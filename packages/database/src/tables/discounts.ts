import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { coupons } from "./coupons";
import { customers } from "./customers";
import { promotionCodes } from "./promotion-codes";
import { subscriptions } from "./subscriptions";

export const discounts = pgTable("discount", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeDiscountId: text("stripe_discount_id").unique(),
  object: text("object").default("discount"),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupons.id, { onDelete: "cascade" }),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  promotionCodeId: text("promotion_code_id").references(() => promotionCodes.id, { onDelete: "set null" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "cascade" }),
  checkoutSession: text("checkout_session"),
  invoice: text("invoice"),
  invoiceItem: text("invoice_item"),
  subscriptionItem: text("subscription_item"),
  start: timestamp("start", { mode: "date" }).notNull(),
  end: timestamp("end", { mode: "date" }),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
