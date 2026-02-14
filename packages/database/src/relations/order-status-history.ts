import { relations } from "drizzle-orm";
import { orderStatusHistory } from "../tables/order-status-history";
import { orders } from "../tables/orders";
import { users } from "../tables/users";

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, {
    fields: [orderStatusHistory.orderId],
    references: [orders.id],
  }),
  user: one(users, {
    fields: [orderStatusHistory.changedBy],
    references: [users.id],
  }),
}));
