"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

export type StorefrontPromotion = {
  code: string;
  percentOff: number | null;
  /** Cents, in `currency`. */
  amountOff: number | null;
  currency: string | null;
  expiresAt: Date | null;
  /** Cents: the order total the code needs, if any. */
  minimumAmount: number | null;
};

/**
 * Promotion codes the admin chose to advertise ("Show in the shop"), still active, unexpired and with
 * uses left, on a valid coupon. Re-read hourly, so a code that expires disappears within the hour;
 * Stripe refuses an expired code at checkout regardless.
 */
async function getStorefrontPromotions(): Promise<StorefrontPromotion[]> {
  cacheTag(CACHE_TAGS.promotionCodes, CACHE_TAGS.coupons);
  cacheLife("hours");

  const rows = await db
    .select({
      code: schema.promotionCodes.code,
      expiresAt: schema.promotionCodes.expiresAt,
      restrictions: schema.promotionCodes.restrictions,
      percentOff: schema.coupons.percentOff,
      amountOff: schema.coupons.amountOff,
      currency: schema.coupons.currency,
    })
    .from(schema.promotionCodes)
    .innerJoin(schema.coupons, eq(schema.coupons.id, schema.promotionCodes.couponId))
    .where(
      and(
        eq(schema.promotionCodes.active, true),
        eq(schema.coupons.valid, true),
        sql`${schema.promotionCodes.metadata}->>'storefront' = 'true'`,
        or(isNull(schema.promotionCodes.expiresAt), gt(schema.promotionCodes.expiresAt, new Date())),
        or(
          isNull(schema.promotionCodes.maxRedemptions),
          sql`${schema.promotionCodes.timesRedeemed} < ${schema.promotionCodes.maxRedemptions}`,
        ),
      ),
    )
    .limit(3);

  return rows.map((row) => ({
    code: row.code,
    percentOff: row.percentOff === null ? null : Number(row.percentOff),
    amountOff: row.amountOff,
    currency: row.currency,
    expiresAt: row.expiresAt,
    minimumAmount: row.restrictions?.minimumAmount ?? null,
  }));
}

export { getStorefrontPromotions };
