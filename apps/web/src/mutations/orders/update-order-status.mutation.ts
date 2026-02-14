"use server";

import { OrderShippedEmail } from "@/emails";
import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { sendEmail } from "@/lib/email";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import React from "react";

type Order = typeof schema.orders.$inferSelect;

async function getUserEmail(userId: string): Promise<string | null> {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, userId),
    columns: { email: true },
  });
  return user?.email ?? null;
}

/**
 * Update order status
 */
async function updateOrderStatus(
  orderId: string,
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded",
): Promise<ActionResult<Order>> {
  try {
    const session = await requireAdmin();

    // Get current order to record fromStatus
    const existingOrder = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
      columns: { status: true },
    });

    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }

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

    // Record status change in audit trail
    await db.insert(schema.orderStatusHistory).values({
      orderId,
      fromStatus: existingOrder.status,
      toStatus: status,
      changedBy: session?.user?.id ?? null,
      actor: session?.user?.name ?? "admin",
    });

    // Invalidate order cache
    revalidateTag(CACHE_TAGS.orders, "max");
    revalidateTag(CACHE_TAGS.order(orderId), "max");
    revalidateTag(CACHE_TAGS.orderStatusHistory(orderId), "max");
    if (order.userId) {
      revalidateTag(CACHE_TAGS.ordersByUser(order.userId), "max");
    }

    // Send shipped email
    if (status === "shipped") {
      const recipientEmail = order.guestEmail ?? (order.userId ? await getUserEmail(order.userId) : null);
      if (recipientEmail) {
        const customerName = order.shippingAddress?.name ?? "Customer";
        await sendEmail({
          to: recipientEmail,
          subject: `Your order #${order.id.slice(0, 8)} has shipped!`,
          react: React.createElement(OrderShippedEmail, { orderId: order.id, customerName }),
        });
      }
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
