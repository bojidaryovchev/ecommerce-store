import { z } from "zod";

/** Whole numbers typed into a field, empty allowed. */
const count = z.string().trim().regex(/^\d*$/, "Use a whole number");

/**
 * A Stripe coupon, as the admin types it (amounts in euros, numbers as text). Checked by React Hook Form;
 * the action checks the converted values again before calling Stripe.
 */
export const couponSchema = z
  .object({
    name: z.string().trim().max(40, "At most 40 characters (Stripe's limit)"),
    discountType: z.enum(["percent", "amount"]),
    percentOff: count,
    /** Euros, with a decimal comma or point. */
    amountOff: z
      .string()
      .trim()
      .regex(/^(\d+([.,]\d{1,2})?)?$/, "An amount in euros, like 25 or 12,50"),
    currency: z.enum(["eur", "usd", "gbp"]),
    duration: z.enum(["once", "forever", "repeating"]),
    durationInMonths: count,
    maxRedemptions: count,
  })
  .superRefine((coupon, context) => {
    if (coupon.discountType === "percent") {
      const percent = Number(coupon.percentOff);
      if (!coupon.percentOff || percent < 1 || percent > 100) {
        context.addIssue({ code: "custom", path: ["percentOff"], message: "Between 1 and 100" });
      }
    } else if (!coupon.amountOff || Number(coupon.amountOff.replace(",", ".")) <= 0) {
      context.addIssue({ code: "custom", path: ["amountOff"], message: "More than 0" });
    }
    if (coupon.duration === "repeating") {
      const months = Number(coupon.durationInMonths);
      if (!coupon.durationInMonths || months < 1 || months > 36) {
        context.addIssue({ code: "custom", path: ["durationInMonths"], message: "Between 1 and 36 months" });
      }
    }
  });

export type CouponInput = z.input<typeof couponSchema>;

/** The form's values as the create action takes them: cents, numbers, nothing empty. */
export function couponPayload(input: CouponInput) {
  const cents = Math.round(Number(input.amountOff.replace(",", ".")) * 100);
  return {
    ...(input.name ? { name: input.name } : {}),
    ...(input.discountType === "percent"
      ? { percentOff: Number(input.percentOff) }
      : { amountOff: cents, currency: input.currency }),
    duration: input.duration,
    ...(input.duration === "repeating" ? { durationInMonths: Number(input.durationInMonths) } : {}),
    ...(input.maxRedemptions ? { maxRedemptions: Number(input.maxRedemptions) } : {}),
  };
}
