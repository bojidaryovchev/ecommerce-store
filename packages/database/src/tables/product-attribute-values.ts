import { doublePrecision, index, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { attributeValueSourceEnum } from "../enums";
import { attributes } from "./attributes";
import { products } from "./products";

/**
 * One value of one attribute on one product. `numericValue` is set when the value is a
 * number with a unit (e.g. "13000 BTU/h"), so filters can use ranges.
 * Supplier-sourced rows are replaced by the sync unless the product locks "attributes";
 * manual rows are never touched by the sync.
 */
export const productAttributeValues = pgTable(
  "product_attribute_value",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attributeId: text("attribute_id")
      .notNull()
      .references(() => attributes.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    numericValue: doublePrecision("numeric_value"),
    source: attributeValueSourceEnum("source").default("manual").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_attribute_value_unique_idx").on(table.productId, table.attributeId, table.value),
    index("product_attribute_value_attribute_idx").on(table.attributeId, table.numericValue),
  ],
);
