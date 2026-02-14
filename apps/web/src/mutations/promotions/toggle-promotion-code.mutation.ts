"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { PromotionCode } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

async function togglePromotionCode(id: string): Promise<ActionResult<PromotionCode>> {
  try {
    const existing = await db.query.promotionCodes.findFirst({
      where: eq(schema.promotionCodes.id, id),
    });

    if (!existing) {
      return { success: false, error: "Promotion code not found" };
    }

    const newActive = !existing.active;

    // Update in Stripe
    if (existing.stripePromotionCodeId) {
      await stripe.promotionCodes.update(existing.stripePromotionCodeId, {
        active: newActive,
      });
    }

    const [promotionCode] = await db
      .update(schema.promotionCodes)
      .set({ active: newActive, updatedAt: new Date() })
      .where(eq(schema.promotionCodes.id, id))
      .returning();

    revalidateTag(CACHE_TAGS.promotionCodes, "max");
    revalidateTag(CACHE_TAGS.promotionCode(id), "max");

    return { success: true, data: promotionCode };
  } catch (error) {
    console.error("Error toggling promotion code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle promotion code",
    };
  }
}

export { togglePromotionCode };
