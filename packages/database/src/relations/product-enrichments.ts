import { relations } from "drizzle-orm";
import { productEnrichments } from "../tables/product-enrichments";
import { products } from "../tables/products";
import { users } from "../tables/users";

export const productEnrichmentsRelations = relations(productEnrichments, ({ one }) => ({
  product: one(products, {
    fields: [productEnrichments.productId],
    references: [products.id],
  }),
  reviewer: one(users, {
    fields: [productEnrichments.reviewedBy],
    references: [users.id],
  }),
}));
