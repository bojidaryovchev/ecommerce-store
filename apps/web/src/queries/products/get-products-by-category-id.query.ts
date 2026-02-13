"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get products by category ID
 */
async function getProductsByCategoryId(categoryId: string) {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.productsByCategory(categoryId));

  const products = await db.query.products.findMany({
    where: and(eq(schema.products.categoryId, categoryId), eq(schema.products.active, true)),
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
    },
  });

  return products;
}

export { getProductsByCategoryId };
