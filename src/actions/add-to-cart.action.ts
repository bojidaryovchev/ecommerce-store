"use server";

import type { CartData } from "@/actions/get-cart.action";
import { getOrCreateCart } from "@/actions/get-cart.action";
import { calculateCartTotals, getCartExpirationDate } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";
import { isVariantAvailable } from "@/lib/variant-utils";
import { addToCartSchema, type AddToCartData } from "@/schemas/cart.schema";

/**
 * Add product to cart
 * - Creates cart if it doesn't exist
 * - Merges quantity if product+variant combo already exists
 * - Validates stock availability
 * - Updates cart expiration for guest carts
 */
export async function addToCart(data: AddToCartData, sessionId?: string): Promise<CartData> {
  try {
    // Validate input
    const validatedData = addToCartSchema.parse(data);

    // Get or create cart
    const cart = await getOrCreateCart(sessionId);

    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      include: {
        images: {
          take: 1,
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new Error("Product not found or is inactive");
    }

    // If variant is specified, validate it
    let variant = null;
    if (validatedData.variantId) {
      variant = await prisma.productVariant.findUnique({
        where: { id: validatedData.variantId },
      });

      if (!variant) {
        throw new Error("Variant not found");
      }

      // Use variant utility function for validation
      if (!isVariantAvailable(variant, validatedData.quantity)) {
        if (!variant.isActive) {
          throw new Error("This variant is not available");
        }
        throw new Error(`Insufficient stock. Only ${variant.stockQuantity} available`);
      }
    }

    // Check stock availability for products without variants
    if (!variant && product.trackInventory) {
      if (product.stockQuantity < validatedData.quantity) {
        throw new Error(`Insufficient stock. Only ${product.stockQuantity} available`);
      }
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: validatedData.productId,
        variantId: validatedData.variantId || null,
      },
    });

    if (existingItem) {
      // Update existing item quantity
      const newQuantity = existingItem.quantity + validatedData.quantity;

      // Validate new quantity doesn't exceed stock
      if (product.trackInventory) {
        const availableStock = variant ? variant.stockQuantity : product.stockQuantity;
        if (newQuantity > availableStock) {
          throw new Error(
            `Cannot add ${validatedData.quantity} more. Only ${availableStock - existingItem.quantity} available`,
          );
        }
      }

      // Validate max quantity limit
      if (newQuantity > 999) {
        throw new Error("Cannot exceed maximum quantity of 999");
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          variantId: validatedData.variantId,
          quantity: validatedData.quantity,
        },
      });
    }

    // Update cart expiration for guest carts
    if (cart.sessionId && !cart.userId) {
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          expiresAt: getCartExpirationDate(30),
        },
      });
    }

    // Fetch updated cart with all relations
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
    console.error("Failed to add to cart:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add to cart");
  }
}
