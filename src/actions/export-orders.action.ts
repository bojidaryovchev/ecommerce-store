"use server";

import { prisma } from "@/lib/prisma";
import type { OrderFilterData } from "@/schemas/order.schema";
import type { Prisma } from "@prisma/client";

export type ExportOrder = Prisma.OrderGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    shippingAddress: true;
    _count: {
      select: {
        items: true;
      };
    };
  };
}>;

export async function getOrdersForExport(filters?: Partial<OrderFilterData>): Promise<ExportOrder[]> {
  try {
    // Build where clause (same as get-orders.action.ts)
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

    // Fetch ALL orders matching filters (no pagination for export)
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        shippingAddress: true,
        _count: {
          select: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  } catch (error) {
    console.error("Failed to fetch orders for export:", error);
    throw new Error("Failed to fetch orders for export");
  }
}
