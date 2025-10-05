"use server";

import type { CartData } from "@/actions/get-cart.action";
import { auth } from "@/lib/auth";
import { calculateCartTotals } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";

/**
 * Clear all items from cart
 * - Removes all cart items
 * - Useful for post-checkout cleanup or user-initiated clear
 * @param sessionId - Optional session ID for guest carts
 */
export async function clearCart(sessionId?: string): Promise<CartData> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Find cart
    const where: {
      userId?: string | null;
      sessionId?: string | null;
    } = {};

    if (userId) {
      where.userId = userId;
    } else if (sessionId) {
      where.sessionId = sessionId;
    } else {
      throw new Error("Cannot clear cart without userId or sessionId");
    }

    const cart = await prisma.cart.findFirst({
      where,
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Delete all cart items
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Fetch updated cart (should be empty)
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
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
    console.error("Failed to clear cart:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear cart");
  }
}
