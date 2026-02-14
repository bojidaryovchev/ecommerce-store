"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Review } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type CreateReviewInput = {
  productId: string;
  rating: number;
  content?: string;
};

/**
 * Create a review for a product.
 * Requires authentication and a prior purchase of the product.
 */
async function createReview(data: CreateReviewInput): Promise<ActionResult<Review>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to leave a review" };
    }

    const userId = session.user.id;

    // Validate rating
    if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    // Check purchase gate — direct query (not "use cache")
    const completedStatuses = ["paid", "processing", "shipped", "delivered"] as const;
    const userOrders = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), inArray(schema.orders.status, [...completedStatuses])));

    if (userOrders.length === 0) {
      return { success: false, error: "You can only review products you have purchased" };
    }

    const orderIds = userOrders.map((o) => o.id);
    const matchingItem = await db.query.orderItems.findFirst({
      where: and(inArray(schema.orderItems.orderId, orderIds), eq(schema.orderItems.productId, data.productId)),
      columns: { id: true },
    });

    if (!matchingItem) {
      return { success: false, error: "You can only review products you have purchased" };
    }

    // Check duplicate review — direct query (not "use cache")
    const existingReview = await db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.productId, data.productId)),
      columns: { id: true },
    });

    if (existingReview) {
      return { success: false, error: "You have already reviewed this product" };
    }

    const [review] = await db
      .insert(schema.reviews)
      .values({
        productId: data.productId,
        userId,
        rating: data.rating,
        content: data.content ?? null,
      })
      .returning();

    revalidateTag(CACHE_TAGS.reviews, "max");
    revalidateTag(CACHE_TAGS.reviewsByProduct(data.productId), "max");
    revalidateTag(CACHE_TAGS.product(data.productId), "max");

    return { success: true, data: review };
  } catch (error) {
    console.error("Error creating review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create review",
    };
  }
}

export { createReview };
