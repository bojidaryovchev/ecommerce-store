import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

type Order = typeof schema.orders.$inferSelect;
type OrderItem = typeof schema.orderItems.$inferSelect;

export type OrderWithItems = Order & {
  items: (OrderItem & {
    product: typeof schema.products.$inferSelect | null;
  })[];
};

/**
 * Get orders for a user
 */
export async function getOrdersByUserId(userId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.orders, CACHE_TAGS.ordersByUser(userId));

  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.userId, userId),
    orderBy: [desc(schema.orders.createdAt)],
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return orders;
}

/**
 * Get a single order by ID
 */
export async function getOrderById(orderId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.orders, CACHE_TAGS.order(orderId));

  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.id, orderId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return order;
}

/**
 * Get order by Stripe checkout session ID
 */
export async function getOrderByCheckoutSessionId(sessionId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.orders);

  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.stripeCheckoutSessionId, sessionId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return order;
}

/**
 * Get orders by guest email
 */
export async function getOrdersByGuestEmail(email: string) {
  "use cache";
  cacheTag(CACHE_TAGS.orders);

  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.guestEmail, email),
    orderBy: [desc(schema.orders.createdAt)],
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return orders;
}
