import { relations } from "drizzle-orm";
import { cartItems } from "../tables/cart-items";
import { orderItems } from "../tables/order-items";
import { prices } from "../tables/prices";
import { products } from "../tables/products";
import { subscriptionItems } from "../tables/subscription-items";

export const pricesRelations = relations(prices, ({ one, many }) => ({
  product: one(products, {
    fields: [prices.productId],
    references: [products.id],
  }),
  subscriptionItems: many(subscriptionItems),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));
