"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { CartItem } from "@prisma/client";

interface UpdateCartItemParams {
  cartItemId: string;
  quantity: number;
}

export async function prismaUpdateCartItem(params: UpdateCartItemParams): Promise<ActionResult<CartItem>> {
  try {
    const { cartItemId, quantity } = params;

    if (quantity < 1) {
      return {
        success: false,
        error: "Quantity must be at least 1",
      };
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    return {
      success: true,
      data: cartItem,
    };
  } catch (error) {
    console.error("Error updating cart item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart item",
    };
  }
}
