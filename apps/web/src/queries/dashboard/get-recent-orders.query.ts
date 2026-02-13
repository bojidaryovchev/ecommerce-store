"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, ne } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get recent orders for the admin dashboard (last 10, excludes pending)
 */
async function getRecentOrders() {
  cacheTag(CACHE_TAGS.orders);

  const orders = await db.query.orders.findMany({
    where: ne(schema.orders.status, "pending"),
    orderBy: [desc(schema.orders.createdAt)],
    limit: 10,
    with: {
      items: true,
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return orders;
}

export { getRecentOrders };
