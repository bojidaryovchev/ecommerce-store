"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { linkUpload } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import type { Category } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Update an existing category
 */
async function updateCategory(
  id: string,
  data: Partial<Omit<typeof schema.categories.$inferInsert, "id" | "createdAt" | "updatedAt">>,
): Promise<ActionResult<Category>> {
  try {
    await requireAdmin();

    const [category] = await db
      .update(schema.categories)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.categories.id, id))
      .returning();

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    // Link the uploaded image if present (handles new image on update)
    if (data.image) {
      await linkUpload(data.image, category.id, "category");
    }

    revalidateTag(CACHE_TAGS.categories, "max");
    revalidateTag(CACHE_TAGS.category(id), "max");
    revalidateTag(CACHE_TAGS.categoryBySlug(category.slug), "max");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Error updating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export { updateCategory };
