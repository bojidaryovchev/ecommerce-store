import { relations } from "drizzle-orm";
import { categories } from "../tables/categories";
import { supplierCategories } from "../tables/supplier-categories";
import { suppliers } from "../tables/suppliers";

export const supplierCategoriesRelations = relations(supplierCategories, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [supplierCategories.supplierId],
    references: [suppliers.id],
  }),
  category: one(categories, {
    fields: [supplierCategories.categoryId],
    references: [categories.id],
  }),
}));
