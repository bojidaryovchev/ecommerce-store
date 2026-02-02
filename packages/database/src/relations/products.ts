import { relations } from "drizzle-orm";
import { cartItems } from "../tables/cart-items";
import { categories } from "../tables/categories";
import { orderItems } from "../tables/order-items";
import { prices } from "../tables/prices";
import { products } from "../tables/products";
import { reviews } from "../tables/reviews";
import { wishlists } from "../tables/wishlists";

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  defaultPrice: one(prices, {
    fields: [products.defaultPriceId],
    references: [prices.id],
  }),
  prices: many(prices),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlists: many(wishlists),
}));
