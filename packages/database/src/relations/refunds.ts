import { relations } from "drizzle-orm";
import { orders } from "../tables/orders";
import { refunds } from "../tables/refunds";

export const refundsRelations = relations(refunds, ({ one }) => ({
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
}));
