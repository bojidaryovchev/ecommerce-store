import { relations } from "drizzle-orm";
import { orderItems } from "../tables/order-items";
import { orders } from "../tables/orders";
import { prices } from "../tables/prices";
import { products } from "../tables/products";

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
  price: one(prices, {
    fields: [orderItems.priceId],
    references: [prices.id],
  }),
}));
