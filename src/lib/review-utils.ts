import type { Prisma } from "@prisma/client";

/**
 * Review type with user relation
 */
export type ReviewWithUser = Prisma.ReviewGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
  };
}>;

/**
 * Review statistics interface
 */
export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  verifiedPurchaseCount: number;
  approvedCount: number;
}

/**
 * Calculate review statistics for a product
 */
export function calculateReviewStats(
  reviews: { rating: number; isVerifiedPurchase: boolean; isApproved: boolean }[],
): ReviewStats {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      verifiedPurchaseCount: 0,
      approvedCount: 0,
    };
  }

  // Calculate average rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Number((totalRating / totalReviews).toFixed(1));

  // Calculate rating distribution
  const ratingDistribution = reviews.reduce(
    (acc, review) => {
      acc[review.rating as 1 | 2 | 3 | 4 | 5]++;
      return acc;
    },
    { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as { 5: number; 4: number; 3: number; 2: number; 1: number },
  );

  // Count verified purchases
  const verifiedPurchaseCount = reviews.filter((r) => r.isVerifiedPurchase).length;

  // Count approved reviews
  const approvedCount = reviews.filter((r) => r.isApproved).length;

  return {
    averageRating,
    totalReviews,
    ratingDistribution,
    verifiedPurchaseCount,
    approvedCount,
  };
}

/**
 * Format rating for display (e.g., "4.5" or "5.0")
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Get star percentage for partial star display
 * Returns a percentage (0-100) for the fill amount
 */
export function getStarPercentage(rating: number, starPosition: number): number {
  if (rating >= starPosition) {
    return 100; // Full star
  } else if (rating > starPosition - 1) {
    return (rating - (starPosition - 1)) * 100; // Partial star
  }
  return 0; // Empty star
}

/**
 * Get color class based on rating
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return "text-green-600";
  if (rating >= 3.5) return "text-yellow-600";
  if (rating >= 2.5) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get rating label based on value
 */
export function getRatingLabel(rating: number): string {
  if (rating >= 4.5) return "Excellent";
  if (rating >= 3.5) return "Good";
  if (rating >= 2.5) return "Average";
  if (rating >= 1.5) return "Poor";
  return "Very Poor";
}

/**
 * Format time ago (e.g., "2 days ago")
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
}

/**
 * Calculate percentage for rating distribution bars
 */
export function getRatingPercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

/**
 * Sort reviews by different criteria
 */
export function sortReviews<T extends { rating: number; createdAt: Date }>(
  reviews: T[],
  sortBy: "newest" | "oldest" | "highest" | "lowest",
): T[] {
  const sorted = [...reviews];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    case "highest":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return sorted.sort((a, b) => a.rating - b.rating);
    default:
      return sorted;
  }
}

/**
 * Filter reviews by rating
 */
export function filterReviewsByRating<T extends { rating: number }>(reviews: T[], minRating?: number): T[] {
  if (!minRating) return reviews;
  return reviews.filter((review) => review.rating >= minRating);
}

/**
 * Filter reviews by verified purchase
 */
export function filterVerifiedReviews<T extends { isVerifiedPurchase: boolean }>(reviews: T[]): T[] {
  return reviews.filter((review) => review.isVerifiedPurchase);
}

/**
 * Check if review is editable (within edit window, e.g., 7 days)
 */
export function isReviewEditable(createdAt: Date, editWindowDays: number = 30): boolean {
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return diffInDays <= editWindowDays;
}
