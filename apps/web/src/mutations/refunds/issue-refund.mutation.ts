"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import type { RefundReason, RefundStatus } from "@ecommerce/database/schema";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type Refund = typeof schema.refunds.$inferSelect;

type IssueRefundInput = {
  orderId: string;
  /** Amount in cents */
  amount: number;
  reason?: RefundReason;
};

/**
 * Issue a full or partial refund for an order via Stripe
 * Creates a Stripe refund, stores the record locally, and updates order status
 */
async function issueRefund(input: IssueRefundInput): Promise<ActionResult<Refund>> {
  try {
    await requireAdmin();

    const { orderId, amount, reason } = input;

    // 1. Get order and validate it can be refunded
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.id, orderId),
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (!order.stripePaymentIntentId) {
      return { success: false, error: "Order has no associated payment — cannot refund" };
    }

    if (order.status === "cancelled") {
      return { success: false, error: "Cannot refund a cancelled order" };
    }

    if (amount <= 0) {
      return { success: false, error: "Refund amount must be greater than zero" };
    }

    // 2. Calculate total already refunded for this order
    const existingRefunds = await db.query.refunds.findMany({
      where: eq(schema.refunds.orderId, orderId),
      columns: { amount: true, status: true },
    });

    const totalRefunded = existingRefunds
      .filter((r) => r.status === "succeeded" || r.status === "pending")
      .reduce((sum, r) => sum + r.amount, 0);

    const maxRefundable = order.totalAmount - totalRefunded;

    if (amount > maxRefundable) {
      return {
        success: false,
        error: `Refund amount exceeds maximum refundable amount of ${(maxRefundable / 100).toFixed(2)} ${order.currency.toUpperCase()}`,
      };
    }

    // 3. Create refund via Stripe
    const stripeRefund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount,
      ...(reason && reason !== "expired_uncaptured_charge" && { reason }),
    });

    // 4. Store refund record locally
    const refundStatus = (stripeRefund.status ?? "pending") as RefundStatus;
    const [refund] = await db
      .insert(schema.refunds)
      .values({
        stripeRefundId: stripeRefund.id,
        paymentIntentId: null,
        chargeId: null,
        orderId,
        amount: stripeRefund.amount,
        currency: stripeRefund.currency,
        status: refundStatus,
        reason: reason ?? null,
        description: stripeRefund.description ?? null,
        receiptNumber: stripeRefund.receipt_number ?? null,
        created: new Date(stripeRefund.created * 1000),
      })
      .returning();

    // 5. If fully refunded, update order status
    const newTotalRefunded = totalRefunded + amount;
    if (newTotalRefunded >= order.totalAmount) {
      await db
        .update(schema.orders)
        .set({ status: "refunded", updatedAt: new Date() })
        .where(eq(schema.orders.id, orderId));
    }

    // 6. Invalidate caches
    revalidateTag(CACHE_TAGS.orders, "max");
    revalidateTag(CACHE_TAGS.order(orderId), "max");
    revalidateTag(CACHE_TAGS.refundsByOrder(orderId), "max");
    if (order.userId) {
      revalidateTag(CACHE_TAGS.ordersByUser(order.userId), "max");
    }

    return { success: true, data: refund! };
  } catch (error) {
    console.error("Error issuing refund:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to issue refund",
    };
  }
}

export { issueRefund };
