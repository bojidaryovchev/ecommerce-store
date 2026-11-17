import { pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { attributes } from "./attributes";
import { suppliers } from "./suppliers";

/**
 * An attribute in the supplier's shop and which of our attributes it maps to.
 * `key` is the WooCommerce taxonomy (e.g. "pa_color"), or "local:<slug>" for
 * product-specific attributes that have no taxonomy.
 */
export const supplierAttributes = pgTable(
  "supplier_attribute",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    attributeId: text("attribute_id").references(() => attributes.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("supplier_attribute_supplier_key_idx").on(table.supplierId, table.key)],
);
