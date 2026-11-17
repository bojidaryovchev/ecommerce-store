import { relations } from "drizzle-orm";
import { attributes } from "../tables/attributes";
import { productAttributeValues } from "../tables/product-attribute-values";

export const attributesRelations = relations(attributes, ({ many }) => ({
  values: many(productAttributeValues),
}));
