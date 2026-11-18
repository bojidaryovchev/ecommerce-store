"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { reviewSchema, type ReviewError, type ReviewInput } from "@/schemas/review.schema";
import type { Review } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { and, eq, inArray } from "drizzle-orm";
import { revalidateTag } from "next/cache";

type CreateReviewResult = { success: true; data: Review } | { success: false; error: ReviewError };

/**
 * Create a review for a product. Requires a signed-in customer who bought the product (verified buyers only).
 * Errors come back as keys, which the form shows in the customer's language.
 */
async function createReview(input: ReviewInput & { productId: string }): Promise<CreateReviewResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "signIn" };
    const userId = session.user.id;

    const parsed = reviewSchema.safeParse(input);
    if (!parsed.success) {
      const field = String(parsed.error.issues[0]?.path[0]);
      return { success: false, error: field === "rating" ? "rating" : "content" };
    }
    const data = { ...parsed.data, productId: input.productId };

    // Check purchase gate — direct query (not "use cache")
    const completedStatuses = ["paid", "processing", "shipped", "delivered"] as const;
    const userOrders = await db
      .select({ id: schema.orders.id })
      .from(schema.orders)
      .where(and(eq(schema.orders.userId, userId), inArray(schema.orders.status, [...completedStatuses])));

    if (userOrders.length === 0) return { success: false, error: "notPurchased" };

    const orderIds = userOrders.map((o) => o.id);
    const matchingItem = await db.query.orderItems.findFirst({
      where: and(inArray(schema.orderItems.orderId, orderIds), eq(schema.orderItems.productId, data.productId)),
      columns: { id: true },
    });

    if (!matchingItem) return { success: false, error: "notPurchased" };

    // Check duplicate review — direct query (not "use cache")
    const existingReview = await db.query.reviews.findFirst({
      where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.productId, data.productId)),
      columns: { id: true },
    });

    if (existingReview) return { success: false, error: "duplicate" };

    const [review] = await db
      .insert(schema.reviews)
      .values({
        productId: data.productId,
        userId,
        rating: data.rating,
        content: data.content,
      })
      .returning();

    revalidateTag(CACHE_TAGS.reviews, "max");
    revalidateTag(CACHE_TAGS.reviewsByProduct(data.productId), "max");
    revalidateTag(CACHE_TAGS.product(data.productId), "max");

    return { success: true, data: review };
  } catch (error) {
    console.error("Error creating review:", error);
    return { success: false, error: "failed" };
  }
}

export { createReview };
