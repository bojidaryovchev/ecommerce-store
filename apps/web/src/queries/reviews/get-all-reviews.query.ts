"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { count, desc } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetAllReviewsOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Get all reviews with pagination (admin use)
 */
async function getAllReviews(options: GetAllReviewsOptions = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  cacheTag(CACHE_TAGS.reviews);

  const [{ total }] = await db.select({ total: count() }).from(schema.reviews);

  const pageCount = Math.ceil(total / pageSize);

  const reviews = await db.query.reviews.findMany({
    orderBy: [desc(schema.reviews.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  return { data: reviews, pageCount, total };
}

export { getAllReviews, type GetAllReviewsOptions };
