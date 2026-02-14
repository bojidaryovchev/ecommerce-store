"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { count, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetAllProductsOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Get all products including inactive (for admin)
 */
async function getAllProducts(options: GetAllProductsOptions = {}) {
  cacheTag(CACHE_TAGS.products);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [{ total }] = await db.select({ total: count() }).from(schema.products);

  const pageCount = Math.ceil(total / pageSize);

  const products = await db.query.products.findMany({
    orderBy: [desc(schema.products.createdAt)],
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

export { getAllProducts, type GetAllProductsOptions };
