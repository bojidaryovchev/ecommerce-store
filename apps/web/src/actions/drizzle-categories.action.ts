"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Category } from "@ecommerce/database";
import { db, insertCategorySchema, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { linkUpload } from "./uploads.action";

/**
 * Create a new category
 */
export async function createCategory(
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

/**
 * Update an existing category
 */
export async function updateCategory(
  id: string,
  data: Partial<Omit<typeof schema.categories.$inferInsert, "id" | "createdAt" | "updatedAt">>,
): Promise<ActionResult<Category>> {
  try {
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

/**
 * Delete a category (soft delete)
 */
export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
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
    await db
      .update(schema.categories)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.categories.parentId, id));

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

/**
 * Restore a soft-deleted category
 */
export async function restoreCategory(id: string): Promise<ActionResult<Category>> {
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
