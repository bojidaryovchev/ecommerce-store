"use server";

import { prisma } from "@/lib/prisma";

/**
 * Analytics Utilities
 * Core functions for calculating business metrics and insights
 */

export type DateRange = {
  from: Date;
  to: Date;
};

export type TimeGrouping = "hour" | "day" | "week" | "month";

export type RevenueData = {
  date: Date;
  revenue: number;
  orders: number;
  averageOrderValue: number;
};

export type ProductPerformance = {
  productId: string;
  productName: string;
  productSlug: string;
  unitsSold: number;
  revenue: number;
  orders: number;
};

export type CustomerMetrics = {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageLifetimeValue: number;
};

export type OrderMetrics = {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate?: number;
};

/**
 * Get date range presets
 */
export function getDateRangePreset(preset: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case "today":
      return {
        from: today,
        to: now,
      };

    case "yesterday":
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        from: yesterday,
        to: today,
      };

    case "last7days":
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);
      return {
        from: last7Days,
        to: now,
      };

    case "last30days":
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);
      return {
        from: last30Days,
        to: now,
      };

    case "last90days":
      const last90Days = new Date(today);
      last90Days.setDate(last90Days.getDate() - 90);
      return {
        from: last90Days,
        to: now,
      };

    case "thisMonth":
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        from: monthStart,
        to: now,
      };

    case "lastMonth":
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        from: lastMonthStart,
        to: lastMonthEnd,
      };

    default:
      // Default to last 30 days
      return getDateRangePreset("last30days");
  }
}

/**
 * Get comparison date range (previous period)
 */
export function getComparisonRange(range: DateRange): DateRange {
  const duration = range.to.getTime() - range.from.getTime();
  return {
    from: new Date(range.from.getTime() - duration),
    to: new Date(range.from.getTime()),
  };
}

/**
 * Calculate revenue over time with grouping
 */
export async function calculateRevenueOverTime(
  range: DateRange,
  grouping: TimeGrouping = "day",
): Promise<RevenueData[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
      status: {
        in: ["PROCESSING", "SHIPPED", "DELIVERED"],
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Group by time period
  const grouped = new Map<string, { revenue: number; orders: number }>();

  orders.forEach((order) => {
    const key = getTimeGroupKey(order.createdAt, grouping);
    const existing = grouped.get(key) || { revenue: 0, orders: 0 };
    grouped.set(key, {
      revenue: existing.revenue + Number(order.total),
      orders: existing.orders + 1,
    });
  });

  // Convert to array and calculate averages
  return Array.from(grouped.entries())
    .map(([key, data]) => ({
      date: parseTimeGroupKey(key, grouping),
      revenue: data.revenue,
      orders: data.orders,
      averageOrderValue: data.orders > 0 ? data.revenue / data.orders : 0,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Get order metrics for a date range
 */
export async function getOrderMetrics(range: DateRange): Promise<OrderMetrics> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      status: true,
      total: true,
    },
  });

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => ["PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status)).length;
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED").length;
  const pendingOrders = orders.filter((o) => o.status === "PENDING").length;

  const totalRevenue = orders
    .filter((o) => ["PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.total), 0);

  return {
    totalOrders,
    completedOrders,
    cancelledOrders,
    pendingOrders,
    totalRevenue,
    averageOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
  };
}

/**
 * Get top products by revenue or units sold
 */
export async function getTopProducts(
  range: DateRange,
  limit: number = 10,
  sortBy: "revenue" | "units" = "revenue",
): Promise<ProductPerformance[]> {
  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: {
          gte: range.from,
          lte: range.to,
        },
        status: {
          in: ["PROCESSING", "SHIPPED", "DELIVERED"],
        },
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  // Group by product
  const productMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      productSlug: string;
      unitsSold: number;
      revenue: number;
      orders: Set<string>;
    }
  >();

  orderItems.forEach((item) => {
    const key = item.productId;
    const existing = productMap.get(key) || {
      productId: item.product.id,
      productName: item.product.name,
      productSlug: item.product.slug,
      unitsSold: 0,
      revenue: 0,
      orders: new Set<string>(),
    };

    existing.unitsSold += item.quantity;
    existing.revenue += Number(item.unitPrice) * item.quantity;
    existing.orders.add(item.orderId);

    productMap.set(key, existing);
  });

  // Convert to array and sort
  const products = Array.from(productMap.values()).map((p) => ({
    productId: p.productId,
    productName: p.productName,
    productSlug: p.productSlug,
    unitsSold: p.unitsSold,
    revenue: p.revenue,
    orders: p.orders.size,
  }));

  products.sort((a, b) => {
    if (sortBy === "revenue") {
      return b.revenue - a.revenue;
    }
    return b.unitsSold - a.unitsSold;
  });

  return products.slice(0, limit);
}

/**
 * Get customer metrics
 */
export async function getCustomerMetrics(range: DateRange): Promise<CustomerMetrics> {
  // Get all customers who placed orders in the range
  const ordersInRange = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      userId: true,
      total: true,
    },
  });

  const customerIds = new Set(ordersInRange.map((o) => o.userId).filter((id): id is string => !!id));

  // Get all orders for these customers
  const allOrders = await prisma.order.findMany({
    where: {
      userId: {
        in: Array.from(customerIds),
      },
      status: {
        in: ["PROCESSING", "SHIPPED", "DELIVERED"],
      },
    },
    select: {
      userId: true,
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Calculate new vs returning
  let newCustomers = 0;
  let returningCustomers = 0;

  customerIds.forEach((customerId) => {
    const customerOrders = allOrders.filter((o) => o.userId === customerId);
    const firstOrder = customerOrders[0];

    if (firstOrder && firstOrder.createdAt >= range.from && firstOrder.createdAt <= range.to) {
      newCustomers++;
    } else if (customerOrders.length > 0) {
      returningCustomers++;
    }
  });

  // Calculate average lifetime value
  const customerRevenue = new Map<string, number>();
  allOrders.forEach((order) => {
    if (order.userId) {
      const current = customerRevenue.get(order.userId) || 0;
      customerRevenue.set(order.userId, current + Number(order.total));
    }
  });

  const totalRevenue = Array.from(customerRevenue.values()).reduce((sum, rev) => sum + rev, 0);
  const averageLifetimeValue = customerIds.size > 0 ? totalRevenue / customerIds.size : 0;

  return {
    totalCustomers: customerIds.size,
    newCustomers,
    returningCustomers,
    averageLifetimeValue,
  };
}

/**
 * Get order status distribution
 */
export async function getOrderStatusDistribution(
  range: DateRange,
): Promise<{ status: string; count: number; percentage: number }[]> {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: range.from,
        lte: range.to,
      },
    },
    select: {
      status: true,
    },
  });

  const statusCounts = new Map<string, number>();
  orders.forEach((order) => {
    statusCounts.set(order.status, (statusCounts.get(order.status) || 0) + 1);
  });

  const total = orders.length;

  return Array.from(statusCounts.entries())
    .map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Helper: Get time group key for grouping
 */
function getTimeGroupKey(date: Date, grouping: TimeGrouping): string {
  switch (grouping) {
    case "hour":
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
    case "day":
      return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    case "week":
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
    case "month":
      return `${date.getFullYear()}-${date.getMonth() + 1}`;
  }
}

/**
 * Helper: Parse time group key back to date
 */
function parseTimeGroupKey(key: string, grouping: TimeGrouping): Date {
  const parts = key.split("-").map(Number);

  switch (grouping) {
    case "hour":
      return new Date(parts[0], parts[1] - 1, parts[2], parts[3]);
    case "day":
      return new Date(parts[0], parts[1] - 1, parts[2]);
    case "week":
      return new Date(parts[0], parts[1] - 1, parts[2]);
    case "month":
      return new Date(parts[0], parts[1] - 1, 1);
  }
}
