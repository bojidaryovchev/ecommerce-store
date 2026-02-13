"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, count, gte, isNull, ne, sql, sum } from "drizzle-orm";
import { cacheTag } from "next/cache";

type DashboardStats = {
  totalOrders: number;
  totalRevenue: number;
  ordersLast30Days: number;
  revenueLast30Days: number;
  pendingFulfillment: number;
  productCount: number;
  activeProductCount: number;
  categoryCount: number;
};

/**
 * Get aggregated dashboard statistics
 */
async function getDashboardStats(): Promise<DashboardStats> {
  cacheTag(CACHE_TAGS.orders, CACHE_TAGS.products, CACHE_TAGS.categories);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Run all aggregations in parallel
  const [orderStats, recentOrderStats, pendingResult, productStats, categoryResult] = await Promise.all([
    // All-time order count + revenue (exclude pending/cancelled)
    db
      .select({
        totalOrders: count(),
        totalRevenue: sum(schema.orders.totalAmount),
      })
      .from(schema.orders)
      .where(and(ne(schema.orders.status, "pending"), ne(schema.orders.status, "cancelled"))),

    // Last 30 days order count + revenue (exclude pending/cancelled)
    db
      .select({
        ordersLast30Days: count(),
        revenueLast30Days: sum(schema.orders.totalAmount),
      })
      .from(schema.orders)
      .where(
        and(
          ne(schema.orders.status, "pending"),
          ne(schema.orders.status, "cancelled"),
          gte(schema.orders.createdAt, thirtyDaysAgo),
        ),
      ),

    // Orders pending fulfillment (paid or processing)
    db
      .select({ count: count() })
      .from(schema.orders)
      .where(sql`${schema.orders.status} IN ('paid', 'processing')`),

    // Product counts (total and active)
    db
      .select({
        total: count(),
        active: sum(sql`CASE WHEN ${schema.products.active} = true THEN 1 ELSE 0 END`),
      })
      .from(schema.products),

    // Category count (excluding soft-deleted)
    db.select({ count: count() }).from(schema.categories).where(isNull(schema.categories.deletedAt)),
  ]);

  return {
    totalOrders: orderStats[0]?.totalOrders ?? 0,
    totalRevenue: Number(orderStats[0]?.totalRevenue ?? 0),
    ordersLast30Days: recentOrderStats[0]?.ordersLast30Days ?? 0,
    revenueLast30Days: Number(recentOrderStats[0]?.revenueLast30Days ?? 0),
    pendingFulfillment: pendingResult[0]?.count ?? 0,
    productCount: productStats[0]?.total ?? 0,
    activeProductCount: Number(productStats[0]?.active ?? 0),
    categoryCount: categoryResult[0]?.count ?? 0,
  };
}

export { getDashboardStats, type DashboardStats };
