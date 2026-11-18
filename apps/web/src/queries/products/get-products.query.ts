"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all active products (for storefront)
 */
async function getProducts() {
  cacheTag(CACHE_TAGS.products);

  const products = await db.query.products.findMany({
    where: eq(schema.products.active, true),
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
      // Whether the text is still the supplier's (lib/product-indexing.ts).
      supplierProduct: { columns: { id: true } },
    },
  });

  return products;
}

export { getProducts };
