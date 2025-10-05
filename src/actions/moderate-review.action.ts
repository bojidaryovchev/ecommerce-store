"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ReviewWithUser } from "@/lib/review-utils";
import { reviewApprovalSchema } from "@/schemas/review.schema";

/**
 * Moderate a review (admin only)
 * - Approve or reject reviews
 * - Only accessible to admins
 */
export async function moderateReview(
  reviewId: string,
  data: {
    isApproved: boolean;
  },
): Promise<ReviewWithUser> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in");
    }

    // Check admin permission
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPER_ADMIN");

    if (!isAdmin) {
      throw new Error("You do not have permission to moderate reviews");
    }

    // Validate input
    const validatedData = reviewApprovalSchema.parse(data);

    // Fetch the review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new Error("Review not found");
    }

    // Update review approval status
    const review = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isApproved: validatedData.isApproved,
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
    console.error("Failed to moderate review:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to moderate review");
  }
}

/**
 * Get pending reviews for admin moderation
 */
export async function getPendingReviews(): Promise<ReviewWithUser[]> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in");
    }

    // Check admin permission
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPER_ADMIN");

    if (!isAdmin) {
      throw new Error("You do not have permission to view pending reviews");
    }

    // Fetch pending reviews
    const reviews = await prisma.review.findMany({
      where: {
        isApproved: false,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return reviews;
  } catch (error) {
    console.error("Failed to fetch pending reviews:", error);
    throw new Error("Failed to fetch pending reviews");
  }
}
