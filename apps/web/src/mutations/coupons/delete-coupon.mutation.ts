"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

async function deleteCoupon(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    const coupon = await db.query.coupons.findFirst({
      where: eq(schema.coupons.id, id),
    });

    if (!coupon) {
      return { success: false, error: "Coupon not found" };
    }

    // Delete from Stripe
    if (coupon.stripeCouponId) {
      await stripe.coupons.del(coupon.stripeCouponId);
    }

    // Delete from our database (cascade deletes promotion codes)
    await db.delete(schema.coupons).where(eq(schema.coupons.id, id));

    revalidateTag(CACHE_TAGS.coupons, "max");
    revalidateTag(CACHE_TAGS.coupon(id), "max");
    revalidateTag(CACHE_TAGS.promotionCodes, "max");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete coupon",
    };
  }
}

export { deleteCoupon };
