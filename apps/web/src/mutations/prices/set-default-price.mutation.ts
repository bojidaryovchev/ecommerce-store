"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Set the default price for a product
 */
async function setDefaultPrice(productId: string, priceId: string): Promise<ActionResult<Product>> {
  try {
    await requireAdmin();

    const [product] = await db
      .update(schema.products)
      .set({ defaultPriceId: priceId, updatedAt: new Date() })
      .where(eq(schema.products.id, productId))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(productId), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error setting default price:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default price",
    };
  }
}

export { setDefaultPrice };
