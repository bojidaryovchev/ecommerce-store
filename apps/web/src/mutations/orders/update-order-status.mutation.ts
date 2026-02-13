"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type Order = typeof schema.orders.$inferSelect;

/**
 * Update order status
 */
async function updateOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
): Promise<ActionResult<Order>> {
  try {
    const timestamps: Record<string, Date> = {};

    if (status === "paid") {
      timestamps.paidAt = new Date();
    } else if (status === "shipped") {
      timestamps.shippedAt = new Date();
    } else if (status === "delivered") {
      timestamps.deliveredAt = new Date();
    } else if (status === "cancelled") {
      timestamps.cancelledAt = new Date();
    }

    const [order] = await db
      .update(schema.orders)
      .set({
        status,
        ...timestamps,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();

    if (!order) {
      return {
        success: false,
        error: "Order not found",
      };
    }

    // Invalidate order cache
    revalidateTag(CACHE_TAGS.orders, "max");
    revalidateTag(CACHE_TAGS.order(orderId), "max");
    if (order.userId) {
      revalidateTag(CACHE_TAGS.ordersByUser(order.userId), "max");
    }

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update order",
    };
  }
}

export { updateOrderStatus };
