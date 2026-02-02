import { boolean, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const taxRates = pgTable("tax_rate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeTaxRateId: text("stripe_tax_rate_id").unique(),
  object: text("object").default("tax_rate"),
  active: boolean("active").default(true).notNull(),
  country: text("country"),
  description: text("description"),
  displayName: text("display_name").notNull(),
  inclusive: boolean("inclusive").default(false).notNull(),
  jurisdiction: text("jurisdiction"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  percentage: numeric("percentage", { precision: 10, scale: 4 }).notNull(),
  state: text("state"),
  taxType: text("tax_type"),
  effectivePercentage: numeric("effective_percentage", { precision: 10, scale: 4 }),
  livemode: boolean("livemode").default(false).notNull(),
  jurisdictionLevel: text("jurisdiction_level"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
