"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface DeleteProductParams {
  productId: string;
}

export async function prismaDeleteProduct(params: DeleteProductParams): Promise<ActionResult<Product>> {
  try {
    const { productId } = params;

    // Get existing product to get Stripe product ID
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Archive product in Stripe (soft delete)
    if (existingProduct.stripeProductId) {
      await stripe.products.update(existingProduct.stripeProductId, {
        active: false,
      });
    }

    // Soft delete product in database with timestamp
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        active: false,
        deletedAt: new Date(),
      },
      include: {
        prices: true,
      },
    });

    // Also mark associated prices as deleted
    await prisma.price.updateMany({
      where: { productId },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });

    // Revalidate admin products page
    revalidatePath("/admin/products");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
