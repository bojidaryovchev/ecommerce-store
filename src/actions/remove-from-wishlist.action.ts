"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { removeFromWishlistSchema } from "@/schemas/wishlist.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function removeFromWishlist(data: z.infer<typeof removeFromWishlistSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Please sign in to manage your wishlist." };
    }

    // Validate input
    const validatedData = removeFromWishlistSchema.parse(data);

    // Check if item exists in user's wishlist
    const wishlistItem = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: validatedData.productId,
        },
      },
    });

    if (!wishlistItem) {
      return { error: "Product not found in your wishlist." };
    }

    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: validatedData.productId,
        },
      },
    });

    revalidatePath("/account/wishlist");
    return { success: true };
  } catch (error) {
    console.error("Error removing from wishlist:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid product data." };
    }

    return { error: "Failed to remove from wishlist. Please try again." };
  }
}
