"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Price, Product } from "@prisma/client";

type ProductWithPrices = Product & { prices: Price[] };

interface GetAllProductsParams {
  includeInactive?: boolean;
  skip?: number;
  take?: number;
}

export async function prismaGetAllProducts(params?: GetAllProductsParams): Promise<ActionResult<ProductWithPrices[]>> {
  try {
    const { includeInactive = false, skip, take } = params || {};

    const products = await prisma.product.findMany({
      where: includeInactive ? {} : { active: true, deletedAt: null },
      include: {
        prices: {
          where: { active: true, deletedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(skip !== undefined && { skip }),
      ...(take !== undefined && { take }),
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error fetching all products:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.PRODUCT_FETCH_FAILED),
    };
  }
}
