import { relations } from "drizzle-orm";
import { addresses } from "../tables/addresses";
import { users } from "../tables/users";

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
}));
