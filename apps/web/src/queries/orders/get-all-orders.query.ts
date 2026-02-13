"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import { cacheTag } from "next/cache";

type GetAllOrdersOptions = {
  status?: (typeof schema.orders.status.enumValues)[number];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
};

/**
 * Get all orders with optional filters (admin use)
 */
async function getAllOrders(options: GetAllOrdersOptions = {}) {
  const { status, dateFrom, dateTo, limit = 50, offset = 0 } = options;

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

  const orders = await db.query.orders.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(schema.orders.createdAt)],
    limit,
    offset,
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

  return orders;
}

export { getAllOrders, type GetAllOrdersOptions };
