import { relations } from "drizzle-orm";
import { authenticators } from "../tables/authenticators";
import { users } from "../tables/users";

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));
