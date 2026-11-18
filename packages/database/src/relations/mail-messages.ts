import { relations } from "drizzle-orm";
import { mailMessages } from "../tables/mail-messages";
import { mailThreads } from "../tables/mail-threads";
import { users } from "../tables/users";

export const mailMessagesRelations = relations(mailMessages, ({ one }) => ({
  thread: one(mailThreads, {
    fields: [mailMessages.threadId],
    references: [mailThreads.id],
  }),
  sentByUser: one(users, {
    fields: [mailMessages.sentBy],
    references: [users.id],
  }),
}));
