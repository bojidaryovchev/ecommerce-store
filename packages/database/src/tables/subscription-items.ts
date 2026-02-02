import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { prices } from "./prices";
import { subscriptions } from "./subscriptions";

export const subscriptionItems = pgTable("subscription_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeSubscriptionItemId: text("stripe_subscription_item_id").unique().notNull(),
  object: text("object").default("subscription_item"),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => subscriptions.id, { onDelete: "cascade" }),
  priceId: text("price_id")
    .notNull()
    .references(() => prices.id, { onDelete: "cascade" }),
  price: jsonb("price").$type<{
    id?: string;
    product?: string;
    currency?: string;
    unitAmount?: number;
    recurring?: {
      interval?: string;
      intervalCount?: number;
    };
  }>(),
  quantity: integer("quantity").default(1),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  billingThresholds: jsonb("billing_thresholds").$type<{
    usageGte?: number;
  }>(),
  discounts: text("discounts").array(),
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  taxRates: text("tax_rates").array(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
