import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable("product", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeProductId: text("stripe_product_id").unique(),
  object: text("object").default("product"),
  name: text("name").notNull(),
  description: text("description"),
  active: boolean("active").default(true).notNull(),
  images: text("images").array().notNull().default([]),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
  defaultPriceId: text("default_price_id"),
  shippable: boolean("shippable").default(true),
  taxCode: text("tax_code"),
  unitLabel: text("unit_label"),
  url: text("url"),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  statementDescriptor: text("statement_descriptor"),
  livemode: boolean("livemode").default(false).notNull(),
  trackInventory: boolean("track_inventory").default(false).notNull(),
  stockQuantity: integer("stock_quantity"),
  marketingFeatures: jsonb("marketing_features")
    .$type<
      Array<{
        name?: string;
      }>
    >()
    .notNull()
    .default([]),
  packageDimensions: jsonb("package_dimensions").$type<{
    height?: number;
    length?: number;
    weight?: number;
    width?: number;
  }>(),
  updated: timestamp("updated", { mode: "date" }).defaultNow().notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
