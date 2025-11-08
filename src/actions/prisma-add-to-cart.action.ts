"use server";

import { calculateCartExpiration, updateCartActivity } from "@/lib/cart-helpers";
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

    // Validate product and price exist and are active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (!product.active || product.deletedAt) {
      return {
        success: false,
        error: "Product is not available",
      };
    }

    const price = await prisma.price.findUnique({
      where: { id: priceId },
    });

    if (!price) {
      return {
        success: false,
        error: "Price not found",
      };
    }

    if (!price.active || price.deletedAt) {
      return {
        success: false,
        error: "Price is not available",
      };
    }

    if (!price.stripePriceId) {
      return {
        success: false,
        error: "Price is not configured for checkout",
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
      if (userId) {
        cart = await prisma.cart.create({
          data: {
            userId,
            status: "ACTIVE",
            lastActivityAt: new Date(),
          },
          include: { items: true },
        });
      } else if (sessionId) {
        const expiresAt = calculateCartExpiration(true);
        cart = await prisma.cart.create({
          data: {
            sessionId,
            status: "ACTIVE",
            expiresAt,
            lastActivityAt: new Date(),
          },
          include: { items: true },
        });
      } else {
        // This should never happen due to early validation, but TypeScript doesn't know that
        throw new Error("Either userId or sessionId must be provided");
      }
    } else {
      // Prevent adding to checked out or expired carts
      if (cart.status === "CHECKED_OUT" || cart.status === "EXPIRED") {
        return {
          success: false,
          error: "Cannot add items to a checked out or expired cart",
        };
      }
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

    // Update cart activity timestamp
    await updateCartActivity(cart.id);

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
