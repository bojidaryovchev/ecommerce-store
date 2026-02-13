"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { linkUploads } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Update an existing product
 */
async function updateProduct(
  id: string,
  data: Partial<Omit<typeof schema.products.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">>,
): Promise<ActionResult<Product>> {
  try {
    const [product] = await db
      .update(schema.products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, id))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Link the uploaded images if present (handles new images on update)
    if (data.images && data.images.length > 0) {
      await linkUploads(data.images, product.id, "product");
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export { updateProduct };
