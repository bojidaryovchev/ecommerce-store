"use server";

import type { ActionResult } from "@/types/action-result.type";
import type { Category } from "@ecommerce/database";
import { db, insertCategorySchema, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Create a new category
 */
export async function createCategory(
  data: Omit<typeof schema.categories.$inferInsert, "id" | "createdAt" | "updatedAt">,
): Promise<ActionResult<Category>> {
  try {
    const validated = insertCategorySchema.parse(data);

    const [category] = await db.insert(schema.categories).values(validated).returning();

    revalidatePath("/categories");
    revalidatePath("/");

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

    revalidatePath("/categories");
    revalidatePath(`/categories/${category.slug}`);
    revalidatePath("/");

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
 * Delete a category
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

    await db.delete(schema.categories).where(eq(schema.categories.id, id));

    revalidatePath("/categories");
    revalidatePath(`/categories/${category.slug}`);
    revalidatePath("/");

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
