"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Price, Product } from "@prisma/client";

type ProductWithPrices = Product & { prices: Price[] };

export async function prismaGetProductById(id: string): Promise<ActionResult<ProductWithPrices>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        prices: {
          where: { deletedAt: null },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Check if product is soft deleted
    if (product.deletedAt) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.PRODUCT_FETCH_FAILED),
    };
  }
}
