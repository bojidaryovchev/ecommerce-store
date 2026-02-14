"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, count, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetCategoriesOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Get all categories with optional filtering
 * Excludes soft-deleted categories
 */
async function getCategories(options: GetCategoriesOptions = {}) {
  cacheTag(CACHE_TAGS.categories);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.categories)
    .where(isNull(schema.categories.deletedAt));

  const pageCount = Math.ceil(total / pageSize);

  const categories = await db.query.categories.findMany({
    where: isNull(schema.categories.deletedAt),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return { data: categories, total, page, pageSize, pageCount };
}

export { getCategories, type GetCategoriesOptions };
