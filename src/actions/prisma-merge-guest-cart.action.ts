"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";
import { cookies } from "next/headers";

interface MergeGuestCartParams {
  userId: string;
  sessionId: string;
}

export async function prismaMergeGuestCart(params: MergeGuestCartParams): Promise<ActionResult<{ success: true }>> {
  try {
    const { userId, sessionId } = params;

    // Find guest cart by sessionId
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return {
        success: true,
        data: { success: true },
      };
    }

    // Find or create user cart
    let userCart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
    });

    if (!userCart) {
      // Create user cart
      userCart = await prisma.cart.create({
        data: { userId },
        include: { items: true },
      });
    }

    // Merge items from guest cart to user cart
    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        (item) => item.productId === guestItem.productId && item.priceId === guestItem.priceId,
      );

      if (existingItem) {
        // Update quantity if item already exists
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + guestItem.quantity,
          },
        });
      } else {
        // Add new item to user cart
        await prisma.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: guestItem.productId,
            priceId: guestItem.priceId,
            quantity: guestItem.quantity,
          },
        });
      }
    }

    // Delete guest cart after merging
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });

    // Clear the guest cart cookie after merging
    const cookieStore = await cookies();
    cookieStore.delete("cart_session_id");

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge guest cart",
    };
  }
}
