"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get only root categories (no parent)
 * Excludes soft-deleted categories
 */
async function getRootCategories() {
  cacheTag(CACHE_TAGS.categories);

  const categories = await db.query.categories.findMany({
    where: and(isNull(schema.categories.parentId), isNull(schema.categories.deletedAt)),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
}

export { getRootCategories };
