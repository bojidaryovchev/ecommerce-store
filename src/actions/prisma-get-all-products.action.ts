"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Price, Product } from "@prisma/client";

type ProductWithPrices = Product & { prices: Price[] };

interface GetAllProductsParams {
  includeInactive?: boolean;
}

export async function prismaGetAllProducts(params?: GetAllProductsParams): Promise<ActionResult<ProductWithPrices[]>> {
  try {
    const { includeInactive = false } = params || {};

    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { active: true },
      include: {
        prices: {
          where: { active: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}
