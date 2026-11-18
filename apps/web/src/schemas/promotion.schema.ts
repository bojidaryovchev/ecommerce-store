import { z } from "zod";

/**
 * A promotion code on a Stripe coupon, as the admin types it (the minimum order in euros). Checked by React Hook
 * Form; the action checks what reaches Stripe again.
 */
export const promotionSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,40}$/, "3 to 40 letters, digits, - or _"),
  couponId: z.string().min(1, "Choose a coupon"),
  maxRedemptions: z.string().trim().regex(/^\d*$/, "Use a whole number"),
  minimumAmount: z
    .string()
    .trim()
    .regex(/^(\d+([.,]\d{1,2})?)?$/, "An amount in euros, like 50 or 49,90"),
  firstTimeOnly: z.boolean(),
  storefront: z.boolean(),
});

export type PromotionInput = z.input<typeof promotionSchema>;
