"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { linkUpload } from "@/mutations/uploads";
import type { ActionResult } from "@/types/action-result.type";
import type { Category } from "@ecommerce/database";
import { db, insertCategorySchema, schema } from "@ecommerce/database";
import { revalidateTag } from "next/cache";

/**
 * Create a new category
 */
async function createCategory(
  data: Omit<typeof schema.categories.$inferInsert, "id" | "createdAt" | "updatedAt">,
): Promise<ActionResult<Category>> {
  try {
    const validated = insertCategorySchema.parse(data);

    const [category] = await db.insert(schema.categories).values(validated).returning();

    // Link the uploaded image if present
    if (category.image) {
      await linkUpload(category.image, category.id, "category");
    }

    revalidateTag(CACHE_TAGS.categories, "max");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Error creating category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export { createCategory };
