"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
}

export interface RevenueByStatus {
  status: OrderStatus;
  revenue: number;
  count: number;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
}

export async function getOrderStats(days: number = 30): Promise<OrderStats> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalOrders, revenue, pending, completed, cancelled] = await Promise.all([
    // Total orders
    prisma.order.count({
      where: {
        createdAt: {
          gte: since,
        },
      },
    }),

    // Total revenue (only paid orders)
    prisma.order.aggregate({
      where: {
        paymentStatus: PaymentStatus.PAID,
        createdAt: {
          gte: since,
        },
      },
      _sum: {
        total: true,
      },
    }),

    // Pending orders
    prisma.order.count({
      where: {
        status: OrderStatus.PENDING,
        createdAt: {
          gte: since,
        },
      },
    }),

    // Completed orders (delivered)
    prisma.order.count({
      where: {
        status: OrderStatus.DELIVERED,
        createdAt: {
          gte: since,
        },
      },
    }),

    // Cancelled orders
    prisma.order.count({
      where: {
        status: OrderStatus.CANCELLED,
        createdAt: {
          gte: since,
        },
      },
    }),
  ]);

  const totalRevenue = Number(revenue._sum.total || 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return {
    totalOrders,
    totalRevenue,
    pendingOrders: pending,
    completedOrders: completed,
    cancelledOrders: cancelled,
    averageOrderValue,
  };
}

export async function getRevenueByStatus(days: number = 30): Promise<RevenueByStatus[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const result = await prisma.order.groupBy({
    by: ["status"],
    where: {
      paymentStatus: PaymentStatus.PAID,
      createdAt: {
        gte: since,
      },
    },
    _sum: {
      total: true,
    },
    _count: true,
  });

  return result.map((item) => ({
    status: item.status,
    revenue: Number(item._sum.total || 0),
    count: item._count,
  }));
}

export async function getRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
  const orders = await prisma.order.findMany({
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      total: true,
      status: true,
      paymentStatus: true,
      createdAt: true,
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.user?.name || order.customerName,
    total: Number(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
  }));
}
