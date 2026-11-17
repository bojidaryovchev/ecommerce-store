"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getCategorySubtreeIds } from "./get-category-subtree-ids";

/**
 * Get a single category by slug with its products, including products filed under its subcategories
 * Excludes soft-deleted categories
 */
async function getCategoryBySlug(slug: string) {
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.categoryBySlug(slug), CACHE_TAGS.products);

  const category = await db.query.categories.findFirst({
    where: and(eq(schema.categories.slug, slug), isNull(schema.categories.deletedAt)),
    with: {
      children: {
        where: isNull(schema.categories.deletedAt),
        orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
      },
      parent: true,
    },
  });

  if (!category) {
    return category;
  }

  const categoryIds = await getCategorySubtreeIds(category.id);
  const products = await db.query.products.findMany({
    where: and(eq(schema.products.active, true), inArray(schema.products.categoryId, categoryIds)),
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
    },
  });

  return { ...category, products };
}

export { getCategoryBySlug };
