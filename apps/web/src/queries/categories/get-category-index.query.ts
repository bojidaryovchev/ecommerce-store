"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Every live category (id, name, slug, parent) in display order: small enough to load whole,
 * for breadcrumbs, category paths and menus (see lib/category-tree.ts)
 */
async function getCategoryIndex() {
  cacheTag(CACHE_TAGS.categories);

  return db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      slug: schema.categories.slug,
      parentId: schema.categories.parentId,
      image: schema.categories.image,
    })
    .from(schema.categories)
    .where(isNull(schema.categories.deletedAt))
    .orderBy(asc(schema.categories.sortOrder), asc(schema.categories.name));
}

export { getCategoryIndex };
