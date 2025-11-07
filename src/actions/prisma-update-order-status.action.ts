"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Order, OrderStatus } from "@prisma/client";

interface UpdateOrderStatusParams {
  orderId: string;
  status: OrderStatus;
}

export async function prismaUpdateOrderStatus(params: UpdateOrderStatusParams): Promise<ActionResult<Order>> {
  try {
    const { orderId, status } = params;

    // Get existing order
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Update order status in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status",
    };
  }
}
