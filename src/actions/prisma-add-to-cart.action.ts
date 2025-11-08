"use server";

import { calculateCartExpiration, extendCartExpiration, updateCartActivity } from "@/lib/cart-helpers";
import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
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

    // Validate product and price exist and are not deleted
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (product.deletedAt) {
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

    if (price.deletedAt) {
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

    // Use upsert to handle race conditions when adding items concurrently
    // The unique constraint on [cartId, productId, priceId] ensures atomicity
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_priceId: {
          cartId: cart.id,
          productId,
          priceId,
        },
      },
      update: {
        quantity: {
          increment: quantity,
        },
      },
      create: {
        cartId: cart.id,
        productId,
        priceId,
        quantity,
      },
    });

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

    // Update cart activity timestamp and extend expiration for guest carts
    await updateCartActivity(cart.id);
    await extendCartExpiration(cart.id);

    return {
      success: true,
      data: updatedCart,
    };
  } catch (error) {
    console.error("Error adding to cart:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.CART_ADD_FAILED),
    };
  }
}
