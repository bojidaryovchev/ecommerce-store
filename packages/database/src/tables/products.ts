import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeProductId: text("stripe_product_id").unique(),
  object: text("object").default("product"),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  images: text("images").array(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  defaultPriceId: text("default_price_id"),
  shippable: boolean("shippable").default(true),
  taxCode: text("tax_code"),
  unitLabel: text("unit_label"),
  url: text("url"),
  categoryId: text("category_id"),
  statementDescriptor: text("statement_descriptor"),
  livemode: boolean("livemode").default(false).notNull(),
  marketingFeatures: jsonb("marketing_features").$type<
    Array<{
      name?: string;
    }>
  >(),
  packageDimensions: jsonb("package_dimensions").$type<{
    height?: number;
    length?: number;
    weight?: number;
    width?: number;
  }>(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
