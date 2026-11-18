import { relations } from "drizzle-orm";
import { mailMessages } from "../tables/mail-messages";
import { mailThreads } from "../tables/mail-threads";
import { orders } from "../tables/orders";

export const mailThreadsRelations = relations(mailThreads, ({ one, many }) => ({
  order: one(orders, {
    fields: [mailThreads.orderId],
    references: [orders.id],
  }),
  messages: many(mailMessages),
}));
