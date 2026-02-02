import { relations } from "drizzle-orm";
import { sessions } from "../tables/sessions";
import { users } from "../tables/users";

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
