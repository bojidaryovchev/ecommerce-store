"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getWishlist() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Please sign in to view your wishlist." };
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            images: {
              orderBy: { position: "asc" },
              take: 1,
            },
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, wishlistItems };
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return { error: "Failed to load wishlist. Please try again." };
  }
}

export async function getWishlistCount() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { success: true, count: 0 };
    }

    const count = await prisma.wishlistItem.count({
      where: { userId: session.user.id },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Error fetching wishlist count:", error);
    return { success: true, count: 0 };
  }
}
