import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products";
import { suppliers } from "./suppliers";

/**
 * The latest snapshot of one supplier product, exactly as their API returned it, plus
 * the link to our product. `productId` is null when we chose not to sell it (or deleted
 * ours); the sync then keeps the snapshot fresh but never recreates the product.
 */
export const supplierProducts = pgTable(
  "supplier_product",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    externalId: integer("external_id").notNull(),
    productId: text("product_id")
      .unique()
      .references(() => products.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    permalink: text("permalink"),
    sku: text("sku"),
    /** Current selling price in minor units (cents), VAT included; null = no price shown ("price on request"). */
    priceAmount: integer("price_amount"),
    regularPriceAmount: integer("regular_price_amount"),
    currency: text("currency").default("eur").notNull(),
    inStock: boolean("in_stock").notNull(),
    onBackorder: boolean("on_backorder").default(false).notNull(),
    purchasable: boolean("purchasable").notNull(),
    categoryExternalIds: integer("category_external_ids").array().notNull().default([]),
    /** Raw API payload of the last fetch. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    /** Hash of the normalised product; unchanged hash = nothing to do. */
    contentHash: text("content_hash").notNull(),
    supplierModifiedAt: timestamp("supplier_modified_at", { mode: "date" }),
    firstSeenAt: timestamp("first_seen_at", { mode: "date" }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { mode: "date" }).defaultNow().notNull(),
    /** Consecutive syncs this product was absent from the supplier's list. */
    missingCount: integer("missing_count").default(0).notNull(),
    removedAt: timestamp("removed_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("supplier_product_supplier_external_idx").on(table.supplierId, table.externalId)],
);
