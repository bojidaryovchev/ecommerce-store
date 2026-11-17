import { relations } from "drizzle-orm";
import { products } from "../tables/products";
import { supplierProducts } from "../tables/supplier-products";
import { suppliers } from "../tables/suppliers";
import { syncChanges } from "../tables/sync-changes";

export const supplierProductsRelations = relations(supplierProducts, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [supplierProducts.supplierId],
    references: [suppliers.id],
  }),
  product: one(products, {
    fields: [supplierProducts.productId],
    references: [products.id],
  }),
  changes: many(syncChanges),
}));
