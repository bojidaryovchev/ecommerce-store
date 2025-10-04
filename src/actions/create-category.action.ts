"use server";

import { prisma } from "@/lib/prisma";
import { categorySchema, type CategoryFormData } from "@/schemas/category.schema";
import { revalidatePath } from "next/cache";

type CreateCategoryResult =
  | { success: true; data: { id: string; name: string; slug: string } }
  | { success: false; error: string };

export async function createCategory(formData: CategoryFormData): Promise<CreateCategoryResult> {
  try {
    // Validate input data
    const validatedData = categorySchema.parse(formData);

    // Check if slug already exists
    const existingCategory = await prisma.category.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingCategory) {
      return {
        success: false,
        error: "A category with this slug already exists",
      };
    }

    // Create category
    const category = await prisma.category.create({
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
    console.error("Error creating category:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "Failed to create category. Please try again.",
    };
  }
}
