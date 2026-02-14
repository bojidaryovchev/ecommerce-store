"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

async function deletePromotionCode(id: string): Promise<ActionResult> {
  try {
    const promotionCode = await db.query.promotionCodes.findFirst({
      where: eq(schema.promotionCodes.id, id),
    });

    if (!promotionCode) {
      return { success: false, error: "Promotion code not found" };
    }

    // Deactivate in Stripe (promotion codes cannot be deleted, only deactivated)
    if (promotionCode.stripePromotionCodeId) {
      await stripe.promotionCodes.update(promotionCode.stripePromotionCodeId, {
        active: false,
      });
    }

    // Delete from our database
    await db.delete(schema.promotionCodes).where(eq(schema.promotionCodes.id, id));

    revalidateTag(CACHE_TAGS.promotionCodes, "max");
    revalidateTag(CACHE_TAGS.promotionCode(id), "max");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting promotion code:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete promotion code",
    };
  }
}

export { deletePromotionCode };
