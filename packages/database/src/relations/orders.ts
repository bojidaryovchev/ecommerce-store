import { relations } from "drizzle-orm";
import { orderItems } from "../tables/order-items";
import { orders } from "../tables/orders";
import { promotionCodes } from "../tables/promotion-codes";
import { refunds } from "../tables/refunds";
import { users } from "../tables/users";

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  promotionCode: one(promotionCodes, {
    fields: [orders.promotionCodeId],
    references: [promotionCodes.id],
  }),
  items: many(orderItems),
  refunds: many(refunds),
}));
