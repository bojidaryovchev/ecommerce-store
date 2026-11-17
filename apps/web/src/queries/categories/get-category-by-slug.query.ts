"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, eq, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get a single category by slug with its children and parent (its products come from getCatalogPage)
 * Excludes soft-deleted categories
 */
async function getCategoryBySlug(slug: string) {
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.categoryBySlug(slug));

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

  return category;
}

export { getCategoryBySlug };
