"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getCategorySubtreeIds } from "../categories/get-category-subtree-ids";
import { defaultPrice, defaultPriceJoin } from "./catalog-conditions";

/** A few priced products with photos from a category's subtree, in a stable shuffled order. */
async function getCategoryProducts(categorySlug: string, limit = 4) {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);
  cacheLife("days");

  const [category] = await db
    .select({ id: schema.categories.id })
    .from(schema.categories)
    .where(eq(schema.categories.slug, categorySlug))
    .limit(1);
  if (!category) return [];

  const rows = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .innerJoin(defaultPrice, defaultPriceJoin)
    .where(
      and(
        eq(schema.products.active, true),
        inArray(schema.products.categoryId, await getCategorySubtreeIds(category.id)),
        isNotNull(defaultPrice.unitAmount),
        sql`coalesce(array_length(${schema.products.images}, 1), 0) > 0`,
      ),
    )
    .orderBy(sql`md5(${schema.products.id})`)
    .limit(limit);
  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];

  const products = await db.query.products.findMany({
    where: inArray(schema.products.id, ids),
    with: { prices: { where: eq(schema.prices.active, true) }, category: true },
  });
  return products.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export { getCategoryProducts };
