"use server";

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
          where: { active: true },
        },
      },
    });

    if (!product) {
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
      error: error instanceof Error ? error.message : "Failed to fetch product",
    };
  }
}
