import { relations } from "drizzle-orm";
import { accounts } from "../tables/accounts";
import { users } from "../tables/users";

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
