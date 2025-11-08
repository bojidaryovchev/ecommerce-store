"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Order, OrderItem, Price, Product } from "@prisma/client";

type OrderWithItems = Order & {
  items: (OrderItem & {
    product: Product;
    price: Price;
  })[];
};

interface GetOrdersParams {
  userId?: string;
  skip?: number;
  take?: number;
}

export async function prismaGetOrders(params?: GetOrdersParams): Promise<ActionResult<OrderWithItems[]>> {
  try {
    const { userId, skip, take } = params || {};

    const orders = await prisma.order.findMany({
      where: userId ? { userId } : {},
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });

    return {
      success: true,
      data: orders,
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}
