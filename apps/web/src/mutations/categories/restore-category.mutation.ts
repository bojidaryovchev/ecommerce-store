"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Category } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Restore a soft-deleted category
 */
async function restoreCategory(id: string): Promise<ActionResult<Category>> {
  try {
    const [category] = await db
      .update(schema.categories)
      .set({ deletedAt: null, updatedAt: new Date() })
      .where(eq(schema.categories.id, id))
      .returning();

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.category(id), "max");
    revalidateTag(CACHE_TAGS.categoryBySlug(category.slug), "max");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Error restoring category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore category",
    };
  }
}

export { restoreCategory };
