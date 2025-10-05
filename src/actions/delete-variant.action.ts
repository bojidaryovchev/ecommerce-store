"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteVariantSchema, type DeleteVariantInput } from "@/schemas/product-variant.schema";
import { revalidatePath } from "next/cache";

export async function deleteVariant(data: DeleteVariantInput) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!session.user.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validated = deleteVariantSchema.parse(data);

    // Check if variant exists
    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.id },
      include: {
        cartItems: true,
        orderItems: true,
      },
    });

    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    // Check if variant is in any orders
    if (variant.orderItems.length > 0) {
      return {
        success: false,
        error: "Cannot delete variant that has been ordered. Consider deactivating it instead.",
      };
    }

    // Remove from carts before deleting
    if (variant.cartItems.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { variantId: validated.id },
      });
    }

    // Delete variant
    await prisma.productVariant.delete({
      where: { id: validated.id },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${validated.productId}`);

    return { success: true };
  } catch (error) {
    console.error("Delete variant error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete variant" };
  }
}
