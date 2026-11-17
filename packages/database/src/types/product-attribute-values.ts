import { productAttributeValues } from "../tables/product-attribute-values";

export type ProductAttributeValue = typeof productAttributeValues.$inferSelect;
export type NewProductAttributeValue = typeof productAttributeValues.$inferInsert;
