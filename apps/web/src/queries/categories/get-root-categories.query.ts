"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, count, isNull } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 12;

type GetRootCategoriesOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Get only root categories (no parent)
 * Excludes soft-deleted categories
 */
async function getRootCategories(options: GetRootCategoriesOptions = {}) {
  cacheTag(CACHE_TAGS.categories);

  const whereClause = and(isNull(schema.categories.parentId), isNull(schema.categories.deletedAt));

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [{ total }] = await db.select({ total: count() }).from(schema.categories).where(whereClause);

  const pageCount = Math.ceil(total / pageSize);

  const categories = await db.query.categories.findMany({
    where: whereClause,
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return { data: categories, total, page, pageSize, pageCount };
}

export { getRootCategories, type GetRootCategoriesOptions };
