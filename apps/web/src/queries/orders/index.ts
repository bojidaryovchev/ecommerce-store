import { schema } from "@ecommerce/database";

type Order = typeof schema.orders.$inferSelect;
type OrderItem = typeof schema.orderItems.$inferSelect;

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: typeof schema.products.$inferSelect | null;
  })[];
};

export { getOrderByCheckoutSessionId } from "./get-order-by-checkout-session-id.query";
export { getOrderById } from "./get-order-by-id.query";
export { getOrdersByGuestEmail } from "./get-orders-by-guest-email.query";
export { getOrdersByUserId } from "./get-orders-by-user-id.query";
export { type OrderWithItems };
