"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all products including inactive (for admin)
 */
async function getAllProducts() {
  cacheTag(CACHE_TAGS.products);

  const products = await db.query.products.findMany({
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return products;
}

export { getAllProducts };
