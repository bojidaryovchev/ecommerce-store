"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { unlinkUploads } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Delete a product (soft delete by setting active to false)
 */
async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, id),
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Soft delete: set active to false
    await db.update(schema.products).set({ active: false, updatedAt: new Date() }).where(eq(schema.products.id, id));

    // Unlink uploads so orphan cleanup can reclaim storage
    await unlinkUploads(id, "product");

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");
    if (product.categoryId) {
      revalidateTag(CACHE_TAGS.productsByCategory(product.categoryId), "max");
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

export { deleteProduct };
