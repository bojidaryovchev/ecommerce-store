"use server";

import { canUpdateOrderStatus } from "@/lib/order-utils";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface CancelOrderResult {
  success: boolean;
  error?: string;
}

export interface RefundOrderResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

/**
 * Cancel an order
 * Updates order status to CANCELLED and optionally refunds payment if already paid
 */
export async function cancelOrder(
  orderId: string,
  reason?: string,
  refundPayment: boolean = true,
): Promise<CancelOrderResult> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        orderNumber: true,
        notes: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if order can be cancelled
    if (!canUpdateOrderStatus(order.status, OrderStatus.CANCELLED)) {
      return {
        success: false,
        error: `Cannot cancel order with status ${order.status}`,
      };
    }

    // If payment was made and refund is requested, initiate refund first
    if (refundPayment && order.paymentStatus === "PAID" && order.paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          reason: "requested_by_customer",
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            cancellationReason: reason || "Order cancelled by admin",
          },
        });
      } catch (error) {
        console.error("Failed to create Stripe refund:", error);
        return {
          success: false,
          error: "Failed to process refund. Please try again or contact support.",
        };
      }
    }

    // Update order status
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
          updatedAt: new Date(),
          notes: reason
            ? order.status === OrderStatus.CANCELLED
              ? `${order.notes || ""}\n\nCancellation reason: ${reason}`
              : `Cancellation reason: ${reason}`
            : undefined,
        },
      });

      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: order.status,
          toStatus: OrderStatus.CANCELLED,
          note: reason || "Order cancelled",
        },
      });
    });

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);

    return { success: true };
  } catch (error) {
    console.error("Failed to cancel order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel order",
    };
  }
}

/**
 * Process a refund for an order
 * Can do full or partial refunds
 */
export async function processRefund(
  orderId: string,
  amount?: number, // in cents, if not provided = full refund
  reason?: string,
): Promise<RefundOrderResult> {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        total: true,
        orderNumber: true,
        notes: true,
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Verify order is paid
    if (order.paymentStatus !== "PAID") {
      return {
        success: false,
        error: `Cannot refund order with payment status ${order.paymentStatus}`,
      };
    }

    // Verify we have a payment intent ID
    if (!order.paymentIntentId) {
      return {
        success: false,
        error: "No payment intent found for this order",
      };
    }

    // Create refund in Stripe
    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: amount, // undefined = full refund
        reason: "requested_by_customer",
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          refundReason: reason || "Refund processed by admin",
        },
      });

      // Determine if this is a full or partial refund
      const totalCents = Math.round(Number(order.total) * 100);
      const isFullRefund = !amount || amount >= totalCents;

      // Update order
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: isFullRefund ? "REFUNDED" : "PARTIALLY_REFUNDED",
            status: isFullRefund ? OrderStatus.REFUNDED : order.status,
            refundedAt: isFullRefund ? new Date() : undefined,
            updatedAt: new Date(),
            notes: reason ? `${order.notes || ""}\n\nRefund reason: ${reason}` : undefined,
          },
        });

        // Create status history if full refund
        if (isFullRefund && canUpdateOrderStatus(order.status, OrderStatus.REFUNDED)) {
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: order.status,
              toStatus: OrderStatus.REFUNDED,
              note: reason || "Order refunded",
            },
          });
        }
      });

      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${orderId}`);

      return {
        success: true,
        refundId: refund.id,
      };
    } catch (error) {
      console.error("Failed to create Stripe refund:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to process refund",
      };
    }
  } catch (error) {
    console.error("Failed to process refund:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process refund",
    };
  }
}
