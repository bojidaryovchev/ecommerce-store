"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  try {
    // Check if product has variants with orders
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: {
          include: {
            orderItems: true,
          },
        },
        orderItems: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check if product or its variants have been ordered
    const hasOrders = product.orderItems.length > 0 || product.variants.some((v) => v.orderItems.length > 0);

    if (hasOrders) {
      return {
        success: false,
        error: "Cannot delete product that has been ordered. Consider deactivating it instead.",
      };
    }

    // Delete the product (cascade will handle variants, images, cart items, etc.)
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}
