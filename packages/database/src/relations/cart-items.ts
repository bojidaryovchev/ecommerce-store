import { relations } from "drizzle-orm";
import { cartItems } from "../tables/cart-items";
import { carts } from "../tables/carts";
import { prices } from "../tables/prices";
import { products } from "../tables/products";

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, {
    fields: [cartItems.cartId],
    references: [carts.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
  price: one(prices, {
    fields: [cartItems.priceId],
    references: [prices.id],
  }),
}));
