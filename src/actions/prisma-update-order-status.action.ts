"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { FulfillmentStatus, Order, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdateOrderStatusParams {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  trackingNumber?: string;
}

export async function prismaUpdateOrderStatus(params: UpdateOrderStatusParams): Promise<ActionResult<Order>> {
  try {
    const { orderId, status, paymentStatus, fulfillmentStatus, trackingNumber } = params;

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

    // Build update data object
    const updateData: Prisma.OrderUpdateInput = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;

    // Add tracking number to metadata if provided
    if (trackingNumber && fulfillmentStatus === "SHIPPED") {
      const currentMetadata = (existingOrder.metadata as Record<string, unknown> | null) || {};
      updateData.metadata = {
        ...currentMetadata,
        trackingNumber,
      };
    }

    // Update order status in database
    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    // Revalidate admin orders page
    revalidatePath("/admin/orders");

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
