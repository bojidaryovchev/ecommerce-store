"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { unlinkUploads } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Delete a category (soft delete)
 */
async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const category = await db.query.categories.findFirst({
      where: eq(schema.categories.id, id),
    });

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    // Soft delete: set deletedAt timestamp
    await db
      .update(schema.categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.categories.id, id));

    // Also soft delete child categories
    const children = await db.query.categories.findMany({
      where: eq(schema.categories.parentId, id),
    });
    await db
      .update(schema.categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.categories.parentId, id));

    // Unlink uploads so orphan cleanup can reclaim storage
    await unlinkUploads(id, "category");
    for (const child of children) {
      await unlinkUploads(child.id, "category");
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.category(id), "max");
    revalidateTag(CACHE_TAGS.categoryBySlug(category.slug), "max");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error deleting category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

export { deleteCategory };
