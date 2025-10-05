"use server";

import { auth } from "@/lib/auth";
import type { CartItemWithRelations } from "@/lib/cart-utils";
import { calculateCartTotals, isCartExpired } from "@/lib/cart-utils";
import { prisma } from "@/lib/prisma";
import { getTaxRate } from "@/lib/tax-calculator";
import type { CartSummary } from "@/schemas/cart.schema";

export interface CartData {
  id: string;
  items: CartItemWithRelations[];
  summary: CartSummary;
  userId: string | null;
  sessionId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get cart for authenticated user or guest session
 * @param sessionId - Optional session ID for guest carts
 * @returns Cart data with items and calculated totals, or null if no cart exists
 */
export async function getCart(sessionId?: string): Promise<CartData | null> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Build where clause based on authentication status
    const where: {
      userId?: string | null;
      sessionId?: string | null;
    } = {};

    if (userId) {
      // For authenticated users, prioritize user cart
      where.userId = userId;
    } else if (sessionId) {
      // For guests, use session ID
      where.sessionId = sessionId;
    } else {
      // No user or session - no cart
      return null;
    }

    // Fetch cart with full relations
    const cart = await prisma.cart.findFirst({
      where,
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

    if (!cart) {
      return null;
    }

    // Check if cart has expired (for guest carts)
    if (isCartExpired(cart.expiresAt)) {
      // Delete expired cart
      await prisma.cart.delete({
        where: { id: cart.id },
      });
      return null;
    }

    // Get user's default address for tax calculation
    let taxRate = 0;
    if (userId) {
      const defaultAddress = await prisma.address.findFirst({
        where: {
          userId,
          isDefault: true,
        },
      });

      if (defaultAddress) {
        const taxRateData = await getTaxRate(
          defaultAddress.country,
          defaultAddress.state || undefined,
          defaultAddress.city || undefined,
          defaultAddress.postalCode || undefined,
        );
        taxRate = taxRateData?.rate || 0;
      }
    }

    // Calculate cart totals with tax
    const summary = calculateCartTotals(cart.items, taxRate);

    return {
      id: cart.id,
      items: cart.items,
      summary,
      userId: cart.userId,
      sessionId: cart.sessionId,
      expiresAt: cart.expiresAt,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    throw new Error("Failed to fetch cart");
  }
}

/**
 * Get or create cart for authenticated user or guest session
 * @param sessionId - Optional session ID for guest carts
 * @returns Cart data (existing or newly created)
 */
export async function getOrCreateCart(sessionId?: string): Promise<CartData> {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    // Try to get existing cart
    const existingCart = await getCart(sessionId);
    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    let cart;
    if (userId) {
      // Create cart for authenticated user
      cart = await prisma.cart.create({
        data: {
          userId,
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
    } else if (sessionId) {
      // Create cart for guest with expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      cart = await prisma.cart.create({
        data: {
          sessionId,
          expiresAt,
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
    } else {
      throw new Error("Cannot create cart without userId or sessionId");
    }

    const summary = calculateCartTotals(cart.items);

    return {
      id: cart.id,
      items: cart.items,
      summary,
      userId: cart.userId,
      sessionId: cart.sessionId,
      expiresAt: cart.expiresAt,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  } catch (error) {
    console.error("Failed to get or create cart:", error);
    throw new Error("Failed to get or create cart");
  }
}
