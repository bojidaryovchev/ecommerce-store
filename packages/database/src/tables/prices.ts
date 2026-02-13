import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { priceBillingSchemeEnum, priceTypeEnum, taxBehaviorEnum } from "../enums";
import { products } from "./products";

export const prices = pgTable("price", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePriceId: text("stripe_price_id").unique(),
  object: text("object").default("price"),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  currency: text("currency").notNull().default("usd"),
  unitAmount: integer("unit_amount"),
  unitAmountDecimal: text("unit_amount_decimal"),
  type: priceTypeEnum("type").default("one_time").notNull(),
  billingScheme: priceBillingSchemeEnum("billing_scheme").default("per_unit").notNull(),
  recurring: jsonb("recurring").$type<{
    interval: "day" | "week" | "month" | "year";
    intervalCount: number;
    trialPeriodDays?: number;
    usageType?: "licensed" | "metered";
    aggregateUsage?: "last_during_period" | "last_ever" | "max" | "sum";
  }>(),
  tiers: jsonb("tiers").$type<
    Array<{
      upTo: number | "inf";
      unitAmount?: number;
      unitAmountDecimal?: string;
      flatAmount?: number;
      flatAmountDecimal?: string;
    }>
  >(),
  tiersMode: text("tiers_mode").$type<"graduated" | "volume">(),
  taxBehavior: taxBehaviorEnum("tax_behavior").default("unspecified"),
  transformQuantity: jsonb("transform_quantity").$type<{
    divideBy: number;
    round: "up" | "down";
  }>(),
  lookupKey: text("lookup_key"),
  nickname: text("nickname"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  currencyOptions: jsonb("currency_options").$type<
    Record<
      string,
      {
        unitAmount?: number;
        unitAmountDecimal?: string;
        taxBehavior?: string;
        tiers?: Array<{
          upTo?: number | "inf";
          unitAmount?: number;
          flatAmount?: number;
        }>;
      }
    >
  >(),
  customUnitAmount: jsonb("custom_unit_amount").$type<{
    maximum?: number;
    minimum?: number;
    preset?: number;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
