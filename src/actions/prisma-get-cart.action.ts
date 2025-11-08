"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import type { Cart, CartItem, CartStatus, Price, Product } from "@prisma/client";

type CartWithItems = Cart & {
  items: (CartItem & {
    product: Product;
    price: Price;
  })[];
};

interface GetCartParams {
  userId?: string;
  sessionId?: string;
  includeCheckedOut?: boolean; // Optional flag to include checked out carts
}

export async function prismaGetCart(params: GetCartParams): Promise<ActionResult<CartWithItems | null>> {
  try {
    const { userId, sessionId, includeCheckedOut = false } = params;

    if (!userId && !sessionId) {
      return {
        success: false,
        error: "Either userId or sessionId must be provided",
      };
    }

    // Build where clause explicitly to avoid querying with undefined
    const baseWhere = userId ? { userId } : sessionId ? { sessionId } : undefined;

    if (!baseWhere) {
      return {
        success: false,
        error: "Either userId or sessionId must be provided",
      };
    }

    // Add status filter to exclude EXPIRED and optionally CHECKED_OUT carts
    const statusFilter: CartStatus | { not: CartStatus } = includeCheckedOut
      ? { not: "EXPIRED" as CartStatus }
      : ("ACTIVE" as CartStatus);

    const where = {
      ...baseWhere,
      status: statusFilter,
    };

    // Try to find cart by userId or sessionId
    const cart = await prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: true,
            price: true,
          },
        },
      },
    });

    return {
      success: true,
      data: cart,
    };
  } catch (error) {
    console.error("Error fetching cart:", error);
    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.CART_FETCH_FAILED),
    };
  }
}
