import { relations } from "drizzle-orm";
import { orders } from "../tables/orders";
import { products } from "../tables/products";
import { reviews } from "../tables/reviews";
import { users } from "../tables/users";

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));
