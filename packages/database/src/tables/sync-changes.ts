import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { syncChangeStatusEnum, syncChangeTypeEnum } from "../enums";
import { products } from "./products";
import { supplierProducts } from "./supplier-products";
import { suppliers } from "./suppliers";
import { syncRuns } from "./sync-runs";
import { users } from "./users";

/**
 * The sync's review queue and change log. Pending rows need an admin decision;
 * applied/dismissed rows are history.
 */
export const syncChanges = pgTable(
  "sync_change",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    runId: text("run_id").references(() => syncRuns.id, { onDelete: "set null" }),
    supplierProductId: text("supplier_product_id")
      .notNull()
      .references(() => supplierProducts.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, { onDelete: "cascade" }),
    type: syncChangeTypeEnum("type").notNull(),
    /** Which product field changed (price_change, locked_field_changed). */
    field: text("field"),
    previousValue: jsonb("previous_value").$type<unknown>(),
    newValue: jsonb("new_value").$type<unknown>(),
    status: syncChangeStatusEnum("status").default("pending").notNull(),
    resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("sync_change_status_created_idx").on(table.status, table.createdAt),
    index("sync_change_supplier_product_idx").on(table.supplierProductId),
  ],
);
