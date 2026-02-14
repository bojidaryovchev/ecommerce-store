"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get reviews for a product with user info
 */
async function getReviewsByProductId(productId: string) {
  cacheTag(CACHE_TAGS.reviews, CACHE_TAGS.reviewsByProduct(productId));

  const reviews = await db.query.reviews.findMany({
    where: eq(schema.reviews.productId, productId),
    orderBy: [desc(schema.reviews.createdAt)],
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  return reviews;
}

export { getReviewsByProductId };
