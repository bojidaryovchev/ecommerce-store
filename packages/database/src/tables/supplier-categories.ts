import { integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { suppliers } from "./suppliers";

/**
 * A category in the supplier's shop, and which of our categories it maps to.
 * New supplier categories get a matching category of ours on first sight; after that
 * the mapping is ours to change (null = products from it get no category).
 */
export const supplierCategories = pgTable(
  "supplier_category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    externalId: integer("external_id").notNull(),
    parentExternalId: integer("parent_external_id"),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    productCount: integer("product_count").default(0).notNull(),
    categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("supplier_category_supplier_external_idx").on(table.supplierId, table.externalId)],
);
