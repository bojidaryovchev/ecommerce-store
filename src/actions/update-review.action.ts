"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReviewWithUser } from "@/lib/review-utils";
import { reviewUpdateSchema } from "@/schemas/review.schema";

/**
 * Update an existing review
 * - User can only update their own review
 * - Tracks edit timestamp
 * - Requires re-approval if configured
 */
export async function updateReview(
  reviewId: string,
  data: {
    rating?: number;
    title?: string | null;
    comment?: string | null;
  },
): Promise<ReviewWithUser> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in to update a review");
    }

    const userId = session.user.id;

    // Validate input
    const validatedData = reviewUpdateSchema.parse(data);

    // Fetch the review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new Error("Review not found");
    }

    // Check ownership
    if (existingReview.userId !== userId) {
      throw new Error("You can only edit your own reviews");
    }

    // Check if review is still editable (within 30 days)
    const daysSinceCreation = Math.floor((Date.now() - existingReview.createdAt.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation > 30) {
      throw new Error("This review can no longer be edited");
    }

    // Update the review
    // Note: Editing a review requires re-approval from admin
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...validatedData,
        editedAt: new Date(),
        isApproved: false, // Require re-approval after edit
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
    console.error("Failed to update review:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update review");
  }
}
