import { supplierAttributes } from "../tables/supplier-attributes";

export type SupplierAttribute = typeof supplierAttributes.$inferSelect;
export type NewSupplierAttribute = typeof supplierAttributes.$inferInsert;
