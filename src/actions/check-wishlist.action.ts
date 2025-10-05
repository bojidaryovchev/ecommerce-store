"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function checkWishlistStatus(productId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, isInWishlist: false };
    }

    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId,
        },
      },
    });

    return { success: true, isInWishlist: !!wishlistItem };
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    return { success: true, isInWishlist: false };
  }
}

export async function checkMultipleWishlistStatus(productIds: string[]) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, wishlistStatus: {} };
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        userId: session.user.id,
        productId: { in: productIds },
      },
      select: { productId: true },
    });

    const wishlistStatus: Record<string, boolean> = {};
    productIds.forEach((id) => {
      wishlistStatus[id] = wishlistItems.some((item) => item.productId === id);
    });

    return { success: true, wishlistStatus };
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    return { success: true, wishlistStatus: {} };
  }
}
