"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteCategory(id: string) {
  try {
    // Check if category has products
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Prevent deletion if category has products or subcategories
    if (category._count.products > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${category._count.products} product(s). Please move or delete the products first.`,
      };
    }

    if (category._count.children > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${category._count.children} subcategor${category._count.children === 1 ? "y" : "ies"}. Please delete the subcategories first.`,
      };
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, error: "Failed to delete category" };
  }
}
