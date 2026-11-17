"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { linkUploads } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { addLocks, editedLockableFields } from "@ecommerce/supplier-sync";
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
    await requireAdmin();

    const current = await db.query.products.findFirst({
      where: eq(schema.products.id, id),
      with: { supplierProduct: { columns: { id: true } } },
    });

    if (!current) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // On a supplier-synced product, fields edited here stop following the supplier.
    const lockedFields = current.supplierProduct
      ? addLocks(current.lockedFields, editedLockableFields(current, data))
      : undefined;

    const [product] = await db
      .update(schema.products)
      .set({
        ...data,
        ...(lockedFields ? { lockedFields } : {}),
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
    revalidateTag(CACHE_TAGS.supplierSync, "max");
    if (product.categoryId) {
      revalidateTag(CACHE_TAGS.productsByCategory(product.categoryId), "max");
    }

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
