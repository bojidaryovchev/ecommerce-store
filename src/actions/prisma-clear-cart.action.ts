"use server";

import { extendCartExpiration, updateCartActivity } from "@/lib/cart-helpers";
import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";

export async function prismaClearCart(cartId: string): Promise<ActionResult<{ success: true }>> {
  try {
    // Get cart to validate status
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: { status: true },
    });

    if (!cart) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    // Prevent clearing checked out or expired carts
    if (cart.status === "CHECKED_OUT" || cart.status === "EXPIRED") {
      return {
        success: false,
        error: "Cannot clear a checked out or expired cart",
      };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId },
    });

    // Update cart activity timestamp and extend expiration for guest carts
    await updateCartActivity(cartId);
    await extendCartExpiration(cartId);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.CART_CLEAR_FAILED),
    };
  }
}
