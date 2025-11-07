"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Cart, CartItem, Price, Product } from "@prisma/client";

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    price: Price;
  })[];
};

interface GetCartParams {
  userId?: string;
  sessionId?: string;
}

export async function prismaGetCart(params: GetCartParams): Promise<ActionResult<CartWithItems | null>> {
  try {
    const { userId, sessionId } = params;

    if (!userId && !sessionId) {
      return {
        success: false,
        error: "Either userId or sessionId must be provided",
      };
    }

    // Try to find cart by userId first, then sessionId
    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    return {
      success: true,
      data: cart,
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch cart",
    };
  }
}
