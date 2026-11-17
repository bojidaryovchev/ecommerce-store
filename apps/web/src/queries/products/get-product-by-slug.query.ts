"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * A product page's data: prices, category, specifications (attribute values) and latest reviews
 */
async function getProductBySlug(slug: string) {
  cacheTag(CACHE_TAGS.products);

  const product = await db.query.products.findFirst({
    where: eq(schema.products.slug, slug),
    with: {
      prices: {
        where: eq(schema.prices.active, true),
        orderBy: [asc(schema.prices.unitAmount)],
      },
      category: true,
      attributeValues: {
        orderBy: [asc(schema.productAttributeValues.sortOrder)],
        with: { attribute: true },
      },
      reviews: {
        orderBy: [desc(schema.reviews.createdAt)],
        limit: 10,
      },
    },
  });

  if (product) cacheTag(CACHE_TAGS.product(product.id));
  return product;
}

export { getProductBySlug };
