import { relations } from "drizzle-orm";
import { prices } from "../tables/prices";
import { products } from "../tables/products";

export const pricesRelations = relations(prices, ({ one }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
}));
