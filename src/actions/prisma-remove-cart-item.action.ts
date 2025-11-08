"use server";

import { extendCartExpiration, updateCartActivity } from "@/lib/cart-helpers";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";

export async function prismaRemoveCartItem(cartItemId: string): Promise<ActionResult<{ success: true }>> {
  try {
    // Get cart item with cart to validate cart status
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      select: {
        cartId: true,
        cart: {
          select: { status: true },
        },
      },
    });

    if (!cartItem) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    // Prevent modifications to checked out or expired carts
    if (cartItem.cart.status === "CHECKED_OUT" || cartItem.cart.status === "EXPIRED") {
      return {
        success: false,
        error: "Cannot modify a checked out or expired cart",
      };
    }

    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    // Update cart activity timestamp and extend expiration for guest carts
    await updateCartActivity(cartItem.cartId);
    await extendCartExpiration(cartItem.cartId);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove cart item",
    };
  }
}
