"use server";

import { orderEvents } from "@/lib/order-events";
import { canUpdateOrderStatus } from "@/lib/order-utils";
import { prisma } from "@/lib/prisma";
import type { OrderStatusUpdateFormData } from "@/schemas/order.schema";
import { orderStatusUpdateSchema } from "@/schemas/order.schema";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface UpdateOrderStatusResult {
  success: boolean;
  error?: string;
}

export async function updateOrderStatus(
  orderId: string,
  data: OrderStatusUpdateFormData,
): Promise<UpdateOrderStatusResult> {
  try {
    // Validate input
    const validated = orderStatusUpdateSchema.parse(data);

    // Get current order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if status transition is valid
    const targetStatus = validated.status as OrderStatus;
    if (!canUpdateOrderStatus(order.status, targetStatus)) {
      return {
        success: false,
        error: `Cannot update order from ${order.status} to ${targetStatus}`,
      };
    }

    // Update order status and create status history
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Update order
      const updateData: Record<string, unknown> = {
        status: targetStatus,
        updatedAt: new Date(),
      };

      // Set timestamp based on status
      switch (targetStatus) {
        case OrderStatus.SHIPPED:
          updateData.shippedAt = new Date();
          break;
        case OrderStatus.DELIVERED:
          updateData.deliveredAt = new Date();
          break;
        case OrderStatus.CANCELLED:
          updateData.cancelledAt = new Date();
          break;
        case OrderStatus.REFUNDED:
          updateData.refundedAt = new Date();
          break;
      }

      const updated = await tx.order.update({
        where: { id: orderId },
        data: updateData,
        select: { id: true, userId: true, status: true },
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: targetStatus,
          note: validated.note,
        },
      });

      return updated;
    });

    // Emit real-time event for order status change
    orderEvents.emitOrderUpdate({
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      status: updatedOrder.status,
      previousStatus: order.status,
      timestamp: new Date(),
      note: validated.note ?? undefined,
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order status",
    };
  }
}

/**
 * Update tracking number for an order
 */
export async function updateTrackingNumber(orderId: string, trackingNumber: string): Promise<UpdateOrderStatusResult> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to update tracking number:", error);
    return {
      success: false,
      error: "Failed to update tracking number",
    };
  }
}
