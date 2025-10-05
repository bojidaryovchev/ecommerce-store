"use server";

import { prisma } from "@/lib/prisma";
import { calculateReviewStats, type ReviewStats } from "@/lib/review-utils";

/**
 * Get review statistics for a product
 * - Calculates average rating
 * - Shows rating distribution
 * - Counts verified purchases
 */
export async function getReviewStats(productId: string): Promise<ReviewStats> {
  try {
    // Fetch all reviews for the product
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        isApproved: true, // Only count approved reviews
      },
      select: {
        rating: true,
        isVerifiedPurchase: true,
        isApproved: true,
      },
    });

    // Calculate and return statistics
    return calculateReviewStats(reviews);
  } catch (error) {
    console.error("Failed to fetch review statistics:", error);
    throw new Error("Failed to fetch review statistics");
  }
}
