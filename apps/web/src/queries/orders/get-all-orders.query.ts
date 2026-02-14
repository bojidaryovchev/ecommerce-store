"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, count, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetAllOrdersOptions = {
  status?: (typeof schema.orders.status.enumValues)[number];
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
};

/**
 * Get all orders with optional filters (admin use)
 */
async function getAllOrders(options: GetAllOrdersOptions = {}) {
  const { status, dateFrom, dateTo } = options;

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  cacheTag(CACHE_TAGS.orders);

  const conditions: SQL[] = [];

  if (status) {
    conditions.push(eq(schema.orders.status, status));
  }
  if (dateFrom) {
    conditions.push(gte(schema.orders.createdAt, dateFrom));
  }
  if (dateTo) {
    conditions.push(lte(schema.orders.createdAt, dateTo));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db.select({ total: count() }).from(schema.orders).where(whereClause);

  const pageCount = Math.ceil(total / pageSize);

  const orders = await db.query.orders.findMany({
    where: whereClause,
    orderBy: [desc(schema.orders.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      items: {
        with: {
          product: true,
        },
      },
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return { data: orders, total, page, pageSize, pageCount };
}

export { getAllOrders, type GetAllOrdersOptions };
