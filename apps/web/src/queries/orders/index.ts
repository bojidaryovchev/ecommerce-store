import { schema } from "@ecommerce/database";

type Order = typeof schema.orders.$inferSelect;
type OrderItem = typeof schema.orderItems.$inferSelect;

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: typeof schema.products.$inferSelect | null;
  })[];
};

type Refund = typeof schema.refunds.$inferSelect;

type OrderStatusHistoryEntry = typeof schema.orderStatusHistory.$inferSelect & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

type OrderWithItemsAndUser = OrderWithItems & {
  user: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  refunds?: Refund[];
  statusHistory?: OrderStatusHistoryEntry[];
};

export { getAllOrders, type GetAllOrdersOptions } from "./get-all-orders.query";
export { getOrderByCheckoutSessionId } from "./get-order-by-checkout-session-id.query";
export { getOrderById } from "./get-order-by-id.query";
export { getOrderStatusHistory } from "./get-order-status-history.query";
export { getOrdersByGuestEmail } from "./get-orders-by-guest-email.query";
export { getOrdersByUserId } from "./get-orders-by-user-id.query";
export { type OrderStatusHistoryEntry, type OrderWithItems, type OrderWithItemsAndUser };
