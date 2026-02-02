import { relations } from "drizzle-orm";
import { cartItems } from "../tables/cart-items";
import { carts } from "../tables/carts";
import { users } from "../tables/users";

export const cartsRelations = relations(carts, ({ one, many }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  items: many(cartItems),
}));
