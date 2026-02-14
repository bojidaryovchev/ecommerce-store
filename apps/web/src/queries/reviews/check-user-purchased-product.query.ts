import { db, schema } from "@ecommerce/database";
import { and, eq, inArray } from "drizzle-orm";

/**
 * Check whether a user has a completed order containing a given product.
 * Used as a purchase gate for review submission.
 */
async function checkUserPurchasedProduct(userId: string, productId: string): Promise<boolean> {
  // Step 1: get order IDs for this user with a completed status
  const completedStatuses = ["paid", "processing", "shipped", "delivered"] as const;
  const userOrders = await db
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.userId, userId), inArray(schema.orders.status, [...completedStatuses])));

  if (userOrders.length === 0) {
    return false;
  }

  const orderIds = userOrders.map((o) => o.id);

  // Step 2: check if any order item references this product
  const matchingItem = await db.query.orderItems.findFirst({
    where: and(inArray(schema.orderItems.orderId, orderIds), eq(schema.orderItems.productId, productId)),
    columns: { id: true },
  });

  return !!matchingItem;
}

export { checkUserPurchasedProduct };
