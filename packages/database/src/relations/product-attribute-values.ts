import { relations } from "drizzle-orm";
import { attributes } from "../tables/attributes";
import { productAttributeValues } from "../tables/product-attribute-values";
import { products } from "../tables/products";

export const productAttributeValuesRelations = relations(productAttributeValues, ({ one }) => ({
  product: one(products, {
    fields: [productAttributeValues.productId],
    references: [products.id],
  }),
  attribute: one(attributes, {
    fields: [productAttributeValues.attributeId],
    references: [attributes.id],
  }),
}));
