import { supplierProducts } from "../tables/supplier-products";

export type SupplierProduct = typeof supplierProducts.$inferSelect;
export type NewSupplierProduct = typeof supplierProducts.$inferInsert;
