"use server";

import { prisma } from "@/lib/prisma";
import type { ReviewWithUser } from "@/lib/review-utils";

export interface GetReviewsParams {
  productId: string;
  rating?: number; // Filter by minimum rating
  verifiedOnly?: boolean;
  approvedOnly?: boolean;
  sortBy?: "newest" | "oldest" | "highest" | "lowest";
  page?: number;
  limit?: number;
}

export interface GetReviewsResult {
  reviews: ReviewWithUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Get reviews for a product with filtering and pagination
 */
export async function getReviews(params: GetReviewsParams): Promise<GetReviewsResult> {
  try {
    const {
      productId,
      rating,
      verifiedOnly = false,
      approvedOnly = true,
      sortBy = "newest",
      page = 1,
      limit = 10,
    } = params;

    // Build where clause
    interface WhereClause {
      productId: string;
      rating?: { gte: number };
      isVerifiedPurchase?: boolean;
      isApproved?: boolean;
    }

    const where: WhereClause = {
      productId,
    };

    if (rating) {
      where.rating = { gte: rating };
    }

    if (verifiedOnly) {
      where.isVerifiedPurchase = true;
    }

    if (approvedOnly) {
      where.isApproved = true;
    }

    // Build orderBy clause
    type SingleOrderBy = { createdAt?: "desc" | "asc"; rating?: "desc" | "asc" };
    type OrderByClause = SingleOrderBy | SingleOrderBy[];
    let orderBy: OrderByClause = { createdAt: "desc" };
    switch (sortBy) {
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "highest":
        orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
        break;
      case "lowest":
        orderBy = [{ rating: "asc" }, { createdAt: "desc" }];
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.review.count({ where });

    // Fetch reviews
    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    };
  } catch (error) {
    console.error("Failed to fetch reviews:", error);
    throw new Error("Failed to fetch reviews");
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId: string): Promise<ReviewWithUser | null> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
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
    console.error("Failed to fetch review:", error);
    throw new Error("Failed to fetch review");
  }
}

/**
 * Get user's review for a specific product
 */
export async function getUserReview(productId: string, userId: string): Promise<ReviewWithUser | null> {
  try {
    const review = await prisma.review.findUnique({
      where: {
        productId_userId: {
          productId,
          userId,
        },
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
    console.error("Failed to fetch user review:", error);
    throw new Error("Failed to fetch user review");
  }
}
