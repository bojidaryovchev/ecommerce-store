"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { productSearchCondition, productSearchRank } from "./product-search";

/**
 * Search products by name/brand (either alphabet, typo-tolerant) or description
 * Returns only active products with active prices and category
 */
async function searchProducts(query: string) {
  cacheTag(CACHE_TAGS.products);

  const searchCondition = productSearchCondition(query);

  if (!searchCondition) {
    return [];
  }

  const products = await db.query.products.findMany({
    where: and(eq(schema.products.active, true), searchCondition),
    orderBy: [desc(productSearchRank(query)), desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return products;
}

export { searchProducts };
