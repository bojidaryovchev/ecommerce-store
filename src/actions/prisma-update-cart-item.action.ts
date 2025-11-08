"use server";

import { extendCartExpiration, updateCartActivity } from "@/lib/cart-helpers";
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

    // Get cart item with product and price to validate they're still active
    const existingCartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        product: true,
        price: true,
        cart: {
          select: { status: true },
        },
      },
    });

    if (!existingCartItem) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    // Prevent modifications to checked out or expired carts
    if (existingCartItem.cart.status === "CHECKED_OUT" || existingCartItem.cart.status === "EXPIRED") {
      return {
        success: false,
        error: "Cannot modify a checked out or expired cart",
      };
    }

    // Validate product and price are still active
    if (!existingCartItem.product.active || existingCartItem.product.deletedAt) {
      return {
        success: false,
        error: "Product is no longer available",
      };
    }

    if (!existingCartItem.price.active || existingCartItem.price.deletedAt) {
      return {
        success: false,
        error: "Price is no longer available",
      };
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });

    // Update cart activity timestamp and extend expiration for guest carts
    await updateCartActivity(cartItem.cartId);
    await extendCartExpiration(cartItem.cartId);

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
