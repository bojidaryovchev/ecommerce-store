"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Search products by name or description using ILIKE
 * Returns only active products with active prices and category
 */
async function searchProducts(query: string) {
  cacheTag(CACHE_TAGS.products);

  const trimmed = query.trim();

  if (trimmed.length === 0) {
    return [];
  }

  const searchPattern = `%${trimmed}%`;

  const products = await db.query.products.findMany({
    where: and(
      eq(schema.products.active, true),
      or(
        ilike(schema.products.name, searchPattern),
        ilike(sql`COALESCE(${schema.products.description}, '')`, searchPattern),
      ),
    ),
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

export { searchProducts };
