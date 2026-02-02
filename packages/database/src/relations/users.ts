import { relations } from "drizzle-orm";
import { accounts } from "../tables/accounts";
import { addresses } from "../tables/addresses";
import { carts } from "../tables/carts";
import { orders } from "../tables/orders";
import { reviews } from "../tables/reviews";
import { sessions } from "../tables/sessions";
import { users } from "../tables/users";
import { wishlists } from "../tables/wishlists";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  addresses: many(addresses),
  carts: many(carts),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
}));
