"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Restore a soft-deleted product
 */
async function restoreProduct(id: string): Promise<ActionResult<Product>> {
  try {
    const [product] = await db
      .update(schema.products)
      .set({ active: true, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error restoring product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore product",
    };
  }
}

export { restoreProduct };
