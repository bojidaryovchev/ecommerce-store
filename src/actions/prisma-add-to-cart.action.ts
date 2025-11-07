"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Cart } from "@prisma/client";

interface AddToCartParams {
  productId: string;
  priceId: string;
  quantity?: number;
  userId?: string;
  sessionId?: string;
}

export async function prismaAddToCart(params: AddToCartParams): Promise<ActionResult<Cart>> {
  try {
    const { productId, priceId, quantity = 1, userId, sessionId } = params;

    if (!userId && !sessionId) {
      return {
        success: false,
        error: "Either userId or sessionId must be provided",
      };
    }

    // Find or create cart
    let cart = userId
      ? await prisma.cart.findFirst({
          where: { userId },
          include: { items: true },
        })
      : sessionId
        ? await prisma.cart.findUnique({
            where: { sessionId },
            include: { items: true },
          })
        : null;

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { sessionId },
        include: { items: true },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        priceId,
      },
    });

    if (existingItem) {
      // Update quantity
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          priceId,
          quantity,
        },
      });
    }

    // Fetch updated cart
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    if (!updatedCart) {
      return {
        success: false,
        error: "Failed to fetch updated cart",
      };
    }

    return {
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add to cart",
    };
  }
}
