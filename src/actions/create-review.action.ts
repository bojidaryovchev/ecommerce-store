"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReviewWithUser } from "@/lib/review-utils";
import { reviewSchema } from "@/schemas/review.schema";

/**
 * Create a new product review
 * - Validates user authentication
 * - Checks for duplicate reviews (one per user per product)
 * - Optionally verifies if user has purchased the product
 * - Auto-approves or requires moderation based on settings
 */
export async function createReview(data: {
  productId: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}): Promise<ReviewWithUser> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in to write a review");
    }

    const userId = session.user.id;

    // Validate input
    const validatedData = reviewSchema.parse({
      ...data,
      userId,
      isVerifiedPurchase: false,
      isApproved: false,
    });

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: validatedData.productId },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!product.isActive) {
      throw new Error("Cannot review an inactive product");
    }

    // Check if user has already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId: validatedData.productId,
          userId,
        },
      },
    });

    if (existingReview) {
      throw new Error("You have already reviewed this product");
    }

    // Check if user has purchased this product (verified purchase)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId: validatedData.productId,
        order: {
          userId,
          status: "DELIVERED", // Only count delivered orders
        },
      },
    });

    const isVerifiedPurchase = !!hasPurchased;

    // Determine if review should be auto-approved
    // Auto-approve verified purchases, require moderation for others
    const isApproved = isVerifiedPurchase;

    // Create the review
    const review = await prisma.review.create({
      data: {
        productId: validatedData.productId,
        userId,
        rating: validatedData.rating,
        title: validatedData.title,
        comment: validatedData.comment,
        isVerifiedPurchase,
        isApproved,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    return review;
  } catch (error) {
    console.error("Failed to create review:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create review");
  }
}
