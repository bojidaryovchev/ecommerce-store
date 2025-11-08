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

    // Wrap all cart merge operations in a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Find or create user cart
      let userCart = await tx.cart.findFirst({
        where: { userId },
        include: { items: true },
      });

      if (!userCart) {
        // Create user cart (authenticated users don't have expiration)
        userCart = await tx.cart.create({
          data: {
            userId,
            status: "ACTIVE",
            expiresAt: null,
            lastActivityAt: new Date(),
          },
          include: { items: true },
        });
      } else {
        // Validate user cart status before merging
        if (userCart.status === "CHECKED_OUT" || userCart.status === "EXPIRED") {
          throw new Error("Cannot merge into a checked out or expired cart");
        }
      }

      // Merge items from guest cart to user cart
      for (const guestItem of guestCart.items) {
        // Validate that the product and price are still available
        const product = await tx.product.findUnique({
          where: { id: guestItem.productId },
        });

        const price = await tx.price.findUnique({
          where: { id: guestItem.priceId },
        });

        // Skip items that are no longer available (soft deleted or inactive)
        if (!product || !product.active || product.deletedAt) {
          console.log(`Skipping unavailable product ${guestItem.productId} during cart merge`);
          continue;
        }

        if (!price || !price.active || price.deletedAt || !price.stripePriceId) {
          console.log(`Skipping unavailable price ${guestItem.priceId} during cart merge`);
          continue;
        }

        const existingItem = userCart.items.find(
          (item) => item.productId === guestItem.productId && item.priceId === guestItem.priceId,
        );

        if (existingItem) {
          // Update quantity if item already exists
          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: existingItem.quantity + guestItem.quantity,
            },
          });
        } else {
          // Add new item to user cart
          await tx.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              priceId: guestItem.priceId,
              quantity: guestItem.quantity,
            },
          });
        }
      }

      // Update user cart activity and clear expiration (now authenticated)
      await tx.cart.update({
        where: { id: userCart.id },
        data: {
          lastActivityAt: new Date(),
          expiresAt: null,
        },
      });

      // Delete guest cart after merging
      await tx.cart.delete({
        where: { id: guestCart.id },
      });
    });

    // Clear the guest cart cookie after successful merge
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
