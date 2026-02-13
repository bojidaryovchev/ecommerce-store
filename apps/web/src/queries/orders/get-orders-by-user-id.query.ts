"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get orders for a user
 */
async function getOrdersByUserId(userId: string) {
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

export { getOrdersByUserId };
