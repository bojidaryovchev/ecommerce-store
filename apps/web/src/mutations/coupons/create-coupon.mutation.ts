"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Coupon } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { revalidateTag } from "next/cache";

type CreateCouponInput = {
  name?: string;
  percentOff?: number;
  amountOff?: number;
  currency?: string;
  duration: "forever" | "once" | "repeating";
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: Date;
};

async function createCoupon(data: CreateCouponInput): Promise<ActionResult<Coupon>> {
  try {
    if (!data.percentOff && !data.amountOff) {
      return { success: false, error: "Either percent off or amount off is required" };
    }

    if (data.percentOff && data.amountOff) {
      return { success: false, error: "Cannot set both percent off and amount off" };
    }

    if (data.percentOff && (data.percentOff < 1 || data.percentOff > 100)) {
      return { success: false, error: "Percent off must be between 1 and 100" };
    }

    if (data.amountOff && !data.currency) {
      return { success: false, error: "Currency is required for amount-off coupons" };
    }

    if (data.duration === "repeating" && !data.durationInMonths) {
      return { success: false, error: "Duration in months is required for repeating coupons" };
    }

    // Create coupon in Stripe
    const stripeCoupon = await stripe.coupons.create({
      ...(data.percentOff ? { percent_off: data.percentOff } : {}),
      ...(data.amountOff ? { amount_off: data.amountOff, currency: data.currency! } : {}),
      duration: data.duration,
      ...(data.durationInMonths ? { duration_in_months: data.durationInMonths } : {}),
      ...(data.maxRedemptions ? { max_redemptions: data.maxRedemptions } : {}),
      ...(data.redeemBy ? { redeem_by: Math.floor(data.redeemBy.getTime() / 1000) } : {}),
      ...(data.name ? { name: data.name } : {}),
    });

    // Store in our database
    const [coupon] = await db
      .insert(schema.coupons)
      .values({
        stripeCouponId: stripeCoupon.id,
        name: data.name ?? null,
        percentOff: data.percentOff ? String(data.percentOff) : null,
        amountOff: data.amountOff ?? null,
        currency: data.currency ?? null,
        duration: data.duration,
        durationInMonths: data.durationInMonths ?? null,
        maxRedemptions: data.maxRedemptions ?? null,
        redeemBy: data.redeemBy ?? null,
        valid: true,
      })
      .returning();

    revalidateTag(CACHE_TAGS.coupons, "max");

    return { success: true, data: coupon };
  } catch (error) {
    console.error("Error creating coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon",
    };
  }
}

export { createCoupon };
