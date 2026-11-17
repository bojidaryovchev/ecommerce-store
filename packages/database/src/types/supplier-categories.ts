import { supplierCategories } from "../tables/supplier-categories";

export type SupplierCategory = typeof supplierCategories.$inferSelect;
export type NewSupplierCategory = typeof supplierCategories.$inferInsert;
