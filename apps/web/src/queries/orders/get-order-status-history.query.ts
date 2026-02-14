"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get the full status history for an order, ordered chronologically.
 */
async function getOrderStatusHistory(orderId: string) {
  cacheTag(CACHE_TAGS.orderStatusHistory(orderId), CACHE_TAGS.order(orderId));

  const history = await db.query.orderStatusHistory.findMany({
    where: eq(schema.orderStatusHistory.orderId, orderId),
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [asc(schema.orderStatusHistory.createdAt)],
  });

  return history;
}

export { getOrderStatusHistory };
