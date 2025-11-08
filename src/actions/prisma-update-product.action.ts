"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdateProductParams {
  productId: string;
  name?: string;
  description?: string;
  images?: string[];
  lastModifiedBy?: string;
}

export async function prismaUpdateProduct(params: UpdateProductParams): Promise<ActionResult<Product>> {
  try {
    const { productId, name, description, images, lastModifiedBy } = params;

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

    // Build update objects
    const stripeUpdateData: {
      name?: string;
      description?: string;
      images?: string[];
    } = {};

    const dbUpdateData: {
      name?: string;
      description?: string;
      images?: string[];
      lastModifiedBy?: string;
    } = {};

    if (name !== undefined) {
      stripeUpdateData.name = name;
      dbUpdateData.name = name;
    }
    if (description !== undefined) {
      stripeUpdateData.description = description;
      dbUpdateData.description = description;
    }
    if (images !== undefined) {
      stripeUpdateData.images = images;
      dbUpdateData.images = images;
    }
    if (lastModifiedBy !== undefined) {
      dbUpdateData.lastModifiedBy = lastModifiedBy;
    }

    // Update product in Stripe if stripeProductId exists and there are updates
    if (existingProduct.stripeProductId && Object.keys(stripeUpdateData).length > 0) {
      await stripe.products.update(existingProduct.stripeProductId, stripeUpdateData);
    }

    // Update product in database (only if there are updates)
    let product = existingProduct;
    if (Object.keys(dbUpdateData).length > 0) {
      product = await prisma.product.update({
        where: { id: productId },
        data: dbUpdateData,
        include: {
          prices: true,
        },
      });
    } else {
      // If no database updates, still fetch with prices for consistent return type
      const fullProduct = await prisma.product.findUnique({
        where: { id: productId },
        include: { prices: true },
      });
      if (fullProduct) product = fullProduct;
    }

    // Revalidate admin products page
    revalidatePath("/admin/products");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.PRODUCT_UPDATE_FAILED),
    };
  }
}
