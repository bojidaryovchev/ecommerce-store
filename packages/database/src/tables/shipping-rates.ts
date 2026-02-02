import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { taxBehaviorEnum } from "../enums";

export const shippingRates = pgTable("shipping_rate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeShippingRateId: text("stripe_shipping_rate_id").unique(),
  displayName: text("display_name").notNull(),
  type: text("type").notNull().default("fixed_amount"),
  fixedAmount: jsonb("fixed_amount")
    .$type<{
      amount: number;
      currency: string;
    }>()
    .notNull(),
  taxBehavior: taxBehaviorEnum("tax_behavior").default("unspecified"),
  taxCode: text("tax_code"),
  deliveryEstimate: jsonb("delivery_estimate").$type<{
    minimum?: { unit: "business_day" | "day" | "hour" | "week" | "month"; value: number };
    maximum?: { unit: "business_day" | "day" | "hour" | "week" | "month"; value: number };
  }>(),
  active: boolean("active").default(true).notNull(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
