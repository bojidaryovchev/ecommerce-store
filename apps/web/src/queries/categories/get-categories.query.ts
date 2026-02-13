"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all categories with optional filtering
 * Excludes soft-deleted categories
 */
async function getCategories() {
  cacheTag(CACHE_TAGS.categories);

  const categories = await db.query.categories.findMany({
    where: isNull(schema.categories.deletedAt),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
}

export { getCategories };
