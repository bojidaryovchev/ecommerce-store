"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get a single product by ID with all related data
 */
async function getProductById(id: string) {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.product(id));

  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, id),
    with: {
      prices: {
        where: eq(schema.prices.active, true),
        orderBy: [asc(schema.prices.unitAmount)],
      },
      category: true,
      reviews: {
        orderBy: [desc(schema.reviews.createdAt)],
        limit: 10,
      },
    },
  });

  return product;
}

export { getProductById };
