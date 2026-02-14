"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { cacheTag } from "next/cache";

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "name-asc" | "name-desc";

type ProductFilters = {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 12;

/**
 * Pre-query product IDs whose minimum active price falls within the given range.
 * Runs as a separate query so we avoid correlated subqueries inside findMany
 * (Drizzle's relational query builder aliases the outer table, breaking correlations).
 */
async function getProductIdsInPriceRange(minPrice?: number, maxPrice?: number) {
  const havingConditions: SQL[] = [];

  if (minPrice !== undefined) {
    havingConditions.push(gte(sql`MIN(${schema.prices.unitAmount})`, minPrice));
  }

  if (maxPrice !== undefined) {
    havingConditions.push(lte(sql`MIN(${schema.prices.unitAmount})`, maxPrice));
  }

  const rows = await db
    .select({ productId: schema.prices.productId })
    .from(schema.prices)
    .where(eq(schema.prices.active, true))
    .groupBy(schema.prices.productId)
    .having(and(...havingConditions));

  return rows.map((r) => r.productId);
}

/**
 * Get active products with optional search, category filter, price range, and sorting.
 * Unified query used by both the storefront products page and search results.
 */
async function getFilteredProducts(filters: ProductFilters = {}) {
  cacheTag(CACHE_TAGS.products);

  if (filters.categoryId) {
    cacheTag(CACHE_TAGS.productsByCategory(filters.categoryId));
  }

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE);

  const conditions: SQL[] = [eq(schema.products.active, true)];

  // Search filter
  if (filters.query?.trim()) {
    const searchPattern = `%${filters.query.trim()}%`;
    conditions.push(
      or(
        ilike(schema.products.name, searchPattern),
        ilike(sql`COALESCE(${schema.products.description}, '')`, searchPattern),
      )!,
    );
  }

  // Category filter
  if (filters.categoryId) {
    conditions.push(eq(schema.products.categoryId, filters.categoryId));
  }

  // Price range filter — pre-query qualifying product IDs
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const ids = await getProductIdsInPriceRange(filters.minPrice, filters.maxPrice);

    if (ids.length === 0) {
      return { data: [], total: 0, page, pageSize, pageCount: 0 };
    }

    conditions.push(inArray(schema.products.id, ids));
  }

  const whereClause = and(...conditions);

  // Total count for pagination
  const [{ total }] = await db.select({ total: count() }).from(schema.products).where(whereClause);

  const pageCount = Math.ceil(total / pageSize);

  if (total === 0) {
    return { data: [], total: 0, page, pageSize, pageCount: 0 };
  }

  // Sorting
  const orderBy = getOrderBy(filters.sort);

  const products = await db.query.products.findMany({
    where: whereClause,
    orderBy,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return { data: products, total, page, pageSize, pageCount };
}

function getOrderBy(sort?: SortOption) {
  switch (sort) {
    case "price-asc":
      return [asc(schema.products.defaultPriceId), asc(schema.products.createdAt)];
    case "price-desc":
      return [desc(schema.products.defaultPriceId), desc(schema.products.createdAt)];
    case "name-asc":
      return [asc(schema.products.name)];
    case "name-desc":
      return [desc(schema.products.name)];
    case "oldest":
      return [asc(schema.products.createdAt)];
    case "newest":
    default:
      return [desc(schema.products.createdAt)];
  }
}

export { getFilteredProducts };
export type { ProductFilters, SortOption };
