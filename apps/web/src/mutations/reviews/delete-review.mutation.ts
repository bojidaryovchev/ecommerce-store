"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Delete a review. Users can delete their own reviews; admins can delete any review.
 */
async function deleteReview(reviewId: string): Promise<ActionResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in" };
    }

    const review = await db.query.reviews.findFirst({
      where: eq(schema.reviews.id, reviewId),
      columns: { id: true, productId: true, userId: true },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    const isOwner = review.userId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN";

    if (!isOwner && !isAdmin) {
      return { success: false, error: "You are not authorized to delete this review" };
    }

    await db.delete(schema.reviews).where(eq(schema.reviews.id, reviewId));

    revalidateTag(CACHE_TAGS.reviews, "max");
    revalidateTag(CACHE_TAGS.reviewsByProduct(review.productId), "max");
    revalidateTag(CACHE_TAGS.product(review.productId), "max");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete review",
    };
  }
}

export { deleteReview };
