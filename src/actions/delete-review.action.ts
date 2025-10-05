"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Delete a review
 * - User can delete their own review
 * - Admin can delete any review
 */
export async function deleteReview(reviewId: string): Promise<{ success: boolean }> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("You must be logged in to delete a review");
    }

    const userId = session.user.id;
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes("ADMIN") || userRoles.includes("SUPER_ADMIN");

    // Fetch the review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new Error("Review not found");
    }

    // Check permissions: user can delete their own review, admin can delete any
    if (!isAdmin && existingReview.userId !== userId) {
      throw new Error("You can only delete your own reviews");
    }

    // Delete the review
    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete review:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete review");
  }
}
