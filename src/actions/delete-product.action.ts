"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    // Delete the product (cascade will handle related records)
    await prisma.product.deleteMany({
      where: { id },
    });

    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
