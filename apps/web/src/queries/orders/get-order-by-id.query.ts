"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get a single order by ID
 */
async function getOrderById(orderId: string) {
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

export { getOrderById };
