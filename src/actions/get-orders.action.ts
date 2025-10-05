"use server";

import { prisma } from "@/lib/prisma";
import type { OrderFilterData } from "@/schemas/order.schema";
import type { Prisma } from "@prisma/client";

export type Order = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
        image: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            name: true;
            slug: true;
          };
        };
      };
    };
    shippingAddress: true;
    billingAddress: true;
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

export interface GetOrdersResult {
  orders: Order[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getOrders(filters?: Partial<OrderFilterData>): Promise<GetOrdersResult> {
  try {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.OrderWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters?.orderNumber) {
      where.orderNumber = { contains: filters.orderNumber, mode: "insensitive" };
    }

    if (filters?.customerEmail) {
      where.OR = [
        { customerEmail: { contains: filters.customerEmail, mode: "insensitive" } },
        { user: { email: { contains: filters.customerEmail, mode: "insensitive" } } },
      ];
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    // Get total count for pagination
    const total = await prisma.order.count({ where });

    // Fetch orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        shippingAddress: true,
        billingAddress: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    throw new Error("Failed to fetch orders");
  }
}
