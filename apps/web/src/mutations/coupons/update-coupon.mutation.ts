"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Coupon } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type UpdateCouponInput = {
  name?: string;
};

async function updateCoupon(id: string, data: UpdateCouponInput): Promise<ActionResult<Coupon>> {
  try {
    const existing = await db.query.coupons.findFirst({
      where: eq(schema.coupons.id, id),
    });

    if (!existing) {
      return { success: false, error: "Coupon not found" };
    }

    // Update in Stripe (only name/metadata can be updated)
    if (existing.stripeCouponId) {
      await stripe.coupons.update(existing.stripeCouponId, {
        name: data.name ?? undefined,
      });
    }

    const [coupon] = await db
      .update(schema.coupons)
      .set({
        name: data.name ?? existing.name,
        updatedAt: new Date(),
      })
      .where(eq(schema.coupons.id, id))
      .returning();

    revalidateTag(CACHE_TAGS.coupons, "max");
    revalidateTag(CACHE_TAGS.coupon(id), "max");

    return { success: true, data: coupon };
  } catch (error) {
    console.error("Error updating coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update coupon",
    };
  }
}

export { updateCoupon };
