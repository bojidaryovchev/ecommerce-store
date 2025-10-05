"use server";

import { calculateCartTotals } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";
import type { CartData } from "./get-cart.action";
import { getCart } from "./get-cart.action";

/**
 * Merges a guest cart into a user's cart when they log in
 * @param guestSessionId - The session ID of the guest cart
 * @param userId - The ID of the logged-in user
 * @returns The merged cart data or null if no guest cart exists
 */
export async function mergeCarts(guestSessionId: string, userId: string): Promise<CartData | null> {
  try {
    // Fetch the guest cart
    const guestCart = await getCart(guestSessionId);

    // If no guest cart or it's empty, just return the user's cart
    if (!guestCart || !guestCart.items.length) {
      // Check if user already has a cart
      const userCart = await prisma.cart.findFirst({
        where: { userId },
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

      if (!userCart) return null;

      const summary = calculateCartTotals(userCart.items);

      return {
        id: userCart.id,
        items: userCart.items,
        summary,
        userId: userCart.userId,
        sessionId: userCart.sessionId,
        expiresAt: userCart.expiresAt,
        createdAt: userCart.createdAt,
        updatedAt: userCart.updatedAt,
      };
    }

    // Get or create the user's cart
    let userCart = await prisma.cart.findFirst({
      where: { userId },
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

    if (!userCart) {
      // Create a new cart for the user
      userCart = await prisma.cart.create({
        data: {
          userId,
          expiresAt: null, // Authenticated user carts don't expire
        },
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
    }

    // Merge guest cart items into user cart
    for (const guestItem of guestCart.items) {
      // Check if the item already exists in the user's cart
      const existingItem = userCart.items.find(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId,
      );

      if (existingItem) {
        // Item exists - merge quantities (max 999)
        const newQuantity = Math.min(existingItem.quantity + guestItem.quantity, 999);

        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
          },
        });
      } else {
        // Item doesn't exist - add it to the user's cart
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    // Delete the guest cart
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Fetch and return the merged cart with updated totals
    const mergedCart = await prisma.cart.findUnique({
      where: { id: userCart.id },
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

    if (!mergedCart) {
      return null;
    }

    // Calculate totals
    const summary = calculateCartTotals(mergedCart.items);

    return {
      id: mergedCart.id,
      items: mergedCart.items,
      summary,
      userId: mergedCart.userId,
      sessionId: mergedCart.sessionId,
      expiresAt: mergedCart.expiresAt,
      createdAt: mergedCart.createdAt,
      updatedAt: mergedCart.updatedAt,
    };
  } catch (error) {
    console.error("Error merging carts:", error);
    throw new Error("Failed to merge carts");
  }
}
