"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get orders by guest email
 */
async function getOrdersByGuestEmail(email: string) {
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

export { getOrdersByGuestEmail };
