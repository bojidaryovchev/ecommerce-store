import type { RefundReason } from "@ecommerce/database/schema";
import { z } from "zod";

export const REFUND_REASONS = [
  "requested_by_customer",
  "duplicate",
  "fraudulent",
] as const satisfies readonly RefundReason[];

/**
 * A refund on an order, in the order's currency units (euros), up to what is left to refund. Built per order,
 * because the ceiling is the order's; the action and Stripe check the amount again.
 */
export function refundSchema(maxRefundableCents: number) {
  return z.object({
    full: z.boolean(),
    amount: z
      .string()
      .trim()
      .regex(/^\d+([.,]\d{1,2})?$/, "An amount like 25 or 12,50")
      .refine((value) => {
        const cents = Math.round(Number(value.replace(",", ".")) * 100);
        return cents >= 1 && cents <= maxRefundableCents;
      }, "More than 0 and no more than what is left to refund"),
    reason: z.union([z.enum(REFUND_REASONS), z.literal("")]),
  });
}

export type RefundInput = z.input<ReturnType<typeof refundSchema>>;

export const toCents = (amount: string) => Math.round(Number(amount.replace(",", ".")) * 100);
