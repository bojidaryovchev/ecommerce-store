"use server";

import { prisma } from "@/lib/prisma";
import { categoryUpdateSchema, type CategoryUpdateFormData } from "@/schemas/category.schema";
import { revalidatePath } from "next/cache";

type UpdateCategoryResult =
  | { success: true; data: { id: string; name: string; slug: string } }
  | { success: false; error: string };

export async function updateCategory(id: string, formData: CategoryUpdateFormData): Promise<UpdateCategoryResult> {
  try {
    // Validate input data
    const validatedData = categoryUpdateSchema.parse(formData);

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    // If slug is being updated, check if it's already taken by another category
    if (validatedData.slug && validatedData.slug !== existingCategory.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: validatedData.slug },
      });

      if (slugExists && slugExists.id !== id) {
        return {
          success: false,
          error: "A category with this slug already exists",
        };
      }
    }

    // Update category
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        image: validatedData.image,
        parentId: validatedData.parentId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/admin/categories");
    revalidatePath("/categories");

    return {
      success: true,
      data: category,
    };
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to update category. Please try again.",
    };
  }
}
