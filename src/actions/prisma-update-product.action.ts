"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@prisma/client";

interface UpdateProductParams {
  productId: string;
  name?: string;
  description?: string;
  images?: string[];
}

export async function prismaUpdateProduct(params: UpdateProductParams): Promise<ActionResult<Product>> {
  try {
    const { productId, name, description, images } = params;

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

    // Update product in Stripe if stripeProductId exists
    if (existingProduct.stripeProductId) {
      const updateData: {
        name?: string;
        description?: string;
        images?: string[];
      } = {};

      if (name !== undefined) {
        updateData.name = name;
      }
      if (description !== undefined) {
        updateData.description = description;
      }
      if (images !== undefined) {
        updateData.images = images;
      }

      await stripe.products.update(existingProduct.stripeProductId, updateData);
    }

    // Update product in database
    const updateDbData: {
      name?: string;
      description?: string;
      images?: string[];
    } = {};

    if (name !== undefined) {
      updateDbData.name = name;
    }
    if (description !== undefined) {
      updateDbData.description = description;
    }
    if (images !== undefined) {
      updateDbData.images = images;
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateDbData,
      include: {
        prices: true,
      },
    });

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}
