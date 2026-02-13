"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, eq, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get a single category by ID
 * Excludes soft-deleted categories
 */
async function getCategoryById(id: string) {
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.category(id));

  const category = await db.query.categories.findFirst({
    where: and(eq(schema.categories.id, id), isNull(schema.categories.deletedAt)),
    with: {
      products: {
        where: eq(schema.products.active, true),
      },
      children: {
        where: isNull(schema.categories.deletedAt),
      },
      parent: true,
    },
  });

  return category;
}

export { getCategoryById };
