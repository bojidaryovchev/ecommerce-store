"use server";

import type { CartData } from "@/actions/get-cart.action";
import { calculateCartTotals } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";
import { isVariantAvailable } from "@/lib/variant-utils";
import { updateCartItemSchema, type UpdateCartItemData } from "@/schemas/cart.schema";

/**
 * Update cart item quantity
 * - If quantity is 0, removes the item
 * - Validates stock availability
 * - Recalculates cart totals
 */
export async function updateCartItem(data: UpdateCartItemData): Promise<CartData> {
  try {
    // Validate input
    const validatedData = updateCartItemSchema.parse(data);

    // Fetch cart item with relations
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: validatedData.cartItemId },
      include: {
        cart: true,
        product: true,
        variant: true,
      },
    });

    if (!cartItem) {
      throw new Error("Cart item not found");
    }

    // If quantity is 0, delete the item
    if (validatedData.quantity === 0) {
      await prisma.cartItem.delete({
        where: { id: validatedData.cartItemId },
      });
    } else {
      // Validate stock availability
      if (cartItem.variant) {
        // Use variant utility function for validation
        if (!isVariantAvailable(cartItem.variant, validatedData.quantity)) {
          if (!cartItem.variant.isActive) {
            throw new Error("This variant is not available");
          }
          throw new Error(`Insufficient stock. Only ${cartItem.variant.stockQuantity} available`);
        }
      } else if (cartItem.product.trackInventory) {
        // Check product stock for non-variant items
        if (validatedData.quantity > cartItem.product.stockQuantity) {
          throw new Error(`Insufficient stock. Only ${cartItem.product.stockQuantity} available`);
        }
      }

      // Update quantity
      await prisma.cartItem.update({
        where: { id: validatedData.cartItemId },
        data: { quantity: validatedData.quantity },
      });
    }

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
    console.error("Failed to update cart item:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update cart item");
  }
}
