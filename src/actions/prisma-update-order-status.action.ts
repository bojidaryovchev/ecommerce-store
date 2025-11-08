"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import { FulfillmentStatus, Order, OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdateOrderStatusParams {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  fulfillmentStatus?: FulfillmentStatus;
  trackingNumber?: string;
  lastModifiedBy?: string;
}

export async function prismaUpdateOrderStatus(params: UpdateOrderStatusParams): Promise<ActionResult<Order>> {
  try {
    const { orderId, status, paymentStatus, fulfillmentStatus, trackingNumber, lastModifiedBy } = params;

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

    // Validate status transitions (business logic)
    if (status && status !== existingOrder.status) {
      const currentStatus = existingOrder.status;

      // Define valid status transitions
      const validTransitions: Record<OrderStatus, OrderStatus[]> = {
        [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.FAILED],
        [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED, OrderStatus.FAILED],
        [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED, OrderStatus.PARTIALLY_REFUNDED],
        [OrderStatus.FAILED]: [OrderStatus.PENDING, OrderStatus.CANCELLED], // Can retry
        [OrderStatus.CANCELLED]: [], // Terminal state
        [OrderStatus.REFUNDED]: [], // Terminal state
        [OrderStatus.PARTIALLY_REFUNDED]: [OrderStatus.REFUNDED], // Can fully refund
      };

      const allowedTransitions = validTransitions[currentStatus] || [];

      if (!allowedTransitions.includes(status)) {
        return {
          success: false,
          error: `Invalid status transition from ${currentStatus} to ${status}`,
        };
      }
    }

    // Validate fulfillment status requirements
    if (fulfillmentStatus === FulfillmentStatus.shipped && !trackingNumber) {
      return {
        success: false,
        error: "Tracking number is required when marking order as shipped",
      };
    }

    // Build update data object
    const updateData: Prisma.OrderUpdateInput = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (fulfillmentStatus) updateData.fulfillmentStatus = fulfillmentStatus;
    if (lastModifiedBy) updateData.lastModifiedBy = lastModifiedBy;

    // Add tracking number to metadata if provided
    if (trackingNumber && fulfillmentStatus === FulfillmentStatus.shipped) {
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
      error: sanitizeError(error, ErrorMessages.ORDER_UPDATE_FAILED),
    };
  }
}
