"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, eq, inArray } from "drizzle-orm";
import { cacheTag } from "next/cache";

/** Live products by slug, in the order asked for, with what a comparison shows: prices, specifications, category. */
async function getProductsBySlugs(slugs: string[]) {
  cacheTag(CACHE_TAGS.products);
  if (slugs.length === 0) return [];

  const products = await db.query.products.findMany({
    where: and(inArray(schema.products.slug, slugs), eq(schema.products.active, true)),
    with: {
      prices: { where: eq(schema.prices.active, true), orderBy: [asc(schema.prices.unitAmount)] },
      category: true,
      attributeValues: {
        orderBy: [asc(schema.productAttributeValues.sortOrder)],
        with: { attribute: true },
      },
    },
  });
  const position = new Map(slugs.map((slug, index) => [slug, index]));
  return products.sort((a, b) => (position.get(a.slug ?? "") ?? 0) - (position.get(b.slug ?? "") ?? 0));
}

export { getProductsBySlugs };
