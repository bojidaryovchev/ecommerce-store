"use server";

import type { CartData } from "@/actions/get-cart.action";
import { calculateCartTotals } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";
import { removeFromCartSchema, type RemoveFromCartData } from "@/schemas/cart.schema";

/**
 * Remove item from cart
 * - Deletes the specified cart item
 * - Recalculates cart totals
 */
export async function removeFromCart(data: RemoveFromCartData): Promise<CartData> {
  try {
    // Validate input
    const validatedData = removeFromCartSchema.parse(data);

    // Fetch cart item to get cart ID
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      select: { cartId: true },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // Delete the cart item
    await prisma.cartItem.delete({
      where: { id: validatedData.cartItemId },
    });

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cartItem.cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  take: 1,
                  orderBy: {
                    position: "asc",
                  },
                },
              },
            },
            variant: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!updatedCart) {
      throw new Error("Failed to fetch updated cart");
    }

    const summary = calculateCartTotals(updatedCart.items);

    return {
      id: updatedCart.id,
      items: updatedCart.items,
      summary,
      userId: updatedCart.userId,
      sessionId: updatedCart.sessionId,
      expiresAt: updatedCart.expiresAt,
      createdAt: updatedCart.createdAt,
      updatedAt: updatedCart.updatedAt,
    };
  } catch (error) {
    console.error("Failed to remove from cart:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to remove from cart");
  }
}
