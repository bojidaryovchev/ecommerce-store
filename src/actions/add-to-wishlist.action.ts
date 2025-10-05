"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addToWishlistSchema } from "@/schemas/wishlist.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function addToWishlist(data: z.infer<typeof addToWishlistSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Please sign in to add items to your wishlist." };
    }

    // Validate input
    const validatedData = addToWishlistSchema.parse(data);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
      select: { id: true, name: true, isActive: true },
    });

    if (!product) {
      return { error: "Product not found." };
    }

    if (!product.isActive) {
      return { error: "This product is no longer available." };
    }

    // Check if already in wishlist
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId: session.user.id,
          productId: validatedData.productId,
        },
      },
    });

    if (existing) {
      return { error: "Product is already in your wishlist." };
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        userId: session.user.id,
        productId: validatedData.productId,
      },
    });

    revalidatePath("/account/wishlist");
    return { success: true, wishlistItem };
  } catch (error) {
    console.error("Error adding to wishlist:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid product data." };
    }

    return { error: "Failed to add to wishlist. Please try again." };
  }
}
