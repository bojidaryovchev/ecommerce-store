import { relations } from "drizzle-orm";
import { products } from "../tables/products";
import { supplierProducts } from "../tables/supplier-products";
import { suppliers } from "../tables/suppliers";
import { syncChanges } from "../tables/sync-changes";
import { syncRuns } from "../tables/sync-runs";
import { users } from "../tables/users";

export const syncChangesRelations = relations(syncChanges, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [syncChanges.supplierId],
    references: [suppliers.id],
  }),
  run: one(syncRuns, {
    fields: [syncChanges.runId],
    references: [syncRuns.id],
  }),
  supplierProduct: one(supplierProducts, {
    fields: [syncChanges.supplierProductId],
    references: [supplierProducts.id],
  }),
  product: one(products, {
    fields: [syncChanges.productId],
    references: [products.id],
  }),
  resolvedByUser: one(users, {
    fields: [syncChanges.resolvedBy],
    references: [users.id],
  }),
}));
