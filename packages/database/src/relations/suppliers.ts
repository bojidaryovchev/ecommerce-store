import { relations } from "drizzle-orm";
import { supplierAttributes } from "../tables/supplier-attributes";
import { supplierCategories } from "../tables/supplier-categories";
import { supplierProducts } from "../tables/supplier-products";
import { suppliers } from "../tables/suppliers";
import { syncChanges } from "../tables/sync-changes";
import { syncRuns } from "../tables/sync-runs";

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(supplierProducts),
  categories: many(supplierCategories),
  attributes: many(supplierAttributes),
  syncRuns: many(syncRuns),
  syncChanges: many(syncChanges),
}));
