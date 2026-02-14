"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { linkUploads } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@ecommerce/database";
import { db, insertProductSchema, schema } from "@ecommerce/database";
import { revalidateTag } from "next/cache";

/**
 * Create a new product
 */
async function createProduct(
  data: Omit<typeof schema.products.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">,
): Promise<ActionResult<Product>> {
  try {
    await requireAdmin();

    const validated = insertProductSchema.parse(data);

    const [product] = await db.insert(schema.products).values(validated).returning();

    // Link the uploaded images if present
    if (product.images && product.images.length > 0) {
      await linkUploads(product.images, product.id, "product");
    }

    revalidateTag(CACHE_TAGS.products, "max");
    if (product.categoryId) {
      revalidateTag(CACHE_TAGS.productsByCategory(product.categoryId), "max");
    }

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export { createProduct };
