import { relations } from "drizzle-orm";
import { products } from "../tables/products";
import { users } from "../tables/users";
import { wishlists } from "../tables/wishlists";

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));
