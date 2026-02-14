"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { PromotionCode } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type CreatePromotionCodeInput = {
  code: string;
  couponId: string;
  maxRedemptions?: number;
  expiresAt?: Date;
  firstTimeTransaction?: boolean;
  minimumAmount?: number;
  minimumAmountCurrency?: string;
};

async function createPromotionCode(data: CreatePromotionCodeInput): Promise<ActionResult<PromotionCode>> {
  try {
    await requireAdmin();

    if (!data.code.trim()) {
      return { success: false, error: "Promotion code is required" };
    }

    // Check coupon exists and get its Stripe ID
    const coupon = await db.query.coupons.findFirst({
      where: eq(schema.coupons.id, data.couponId),
      columns: { id: true, stripeCouponId: true },
    });

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    if (!coupon.stripeCouponId) {
      return { success: false, error: "Coupon is not synced with Stripe" };
    }

    // Create in Stripe
    const stripePromo = await stripe.promotionCodes.create({
      promotion: {
        type: "coupon",
        coupon: coupon.stripeCouponId,
      },
      code: data.code.trim().toUpperCase(),
      ...(data.maxRedemptions ? { max_redemptions: data.maxRedemptions } : {}),
      ...(data.expiresAt ? { expires_at: Math.floor(data.expiresAt.getTime() / 1000) } : {}),
      restrictions: {
        ...(data.firstTimeTransaction ? { first_time_transaction: true } : {}),
        ...(data.minimumAmount
          ? {
              minimum_amount: data.minimumAmount,
              minimum_amount_currency: data.minimumAmountCurrency ?? "usd",
            }
          : {}),
      },
    });

    // Store in our database
    const [promotionCode] = await db
      .insert(schema.promotionCodes)
      .values({
        stripePromotionCodeId: stripePromo.id,
        code: data.code.trim().toUpperCase(),
        couponId: data.couponId,
        active: true,
        maxRedemptions: data.maxRedemptions ?? null,
        expiresAt: data.expiresAt ?? null,
        restrictions: {
          firstTimeTransaction: data.firstTimeTransaction ?? false,
          minimumAmount: data.minimumAmount ?? undefined,
          minimumAmountCurrency: data.minimumAmountCurrency ?? undefined,
        },
      })
      .returning();

    revalidateTag(CACHE_TAGS.promotionCodes, "max");

    return { success: true, data: promotionCode };
  } catch (error) {
    console.error("Error creating promotion code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create promotion code",
    };
  }
}

export { createPromotionCode };
