"use client";

import { getReviews, type GetReviewsParams } from "@/actions/get-reviews.action";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ReviewWithUser } from "@/lib/review-utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ReviewCard } from "./review-card";

interface ReviewsListProps {
  productId: string;
  initialReviews?: ReviewWithUser[];
  onReviewEdit?: (review: ReviewWithUser) => void;
  filterRating?: number;
  verifiedOnly?: boolean;
}

/**
 * Reviews List Component
 * - Displays all reviews with filtering and sorting
 * - Pagination support
 * - Empty state handling
 */
export function ReviewsList({
  productId,
  initialReviews,
  onReviewEdit,
  filterRating,
  verifiedOnly = false,
}: ReviewsListProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>(initialReviews || []);
  const [isLoading, setIsLoading] = useState(!initialReviews);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "highest" | "lowest">("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadReviews = async () => {
    try {
      setIsLoading(true);

      const params: GetReviewsParams = {
        productId,
        sortBy,
        page,
        limit: 10,
        approvedOnly: true,
      };

      if (filterRating) {
        params.rating = filterRating;
      }

      if (verifiedOnly) {
        params.verifiedOnly = true;
      }

      const result = await getReviews(params);
      setReviews(result.reviews);
      setTotalPages(result.pagination.totalPages);
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, sortBy, page, filterRating, verifiedOnly]);

  const handleReviewDeleted = () => {
    loadReviews(); // Reload reviews after deletion
  };

  if (isLoading && reviews.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 py-12 text-center">
        <p className="text-gray-600">
          {filterRating || verifiedOnly
            ? "No reviews match your filters. Try adjusting your criteria."
            : "No reviews yet. Be the first to review this product!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sorting Controls */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </p>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger id="sort" className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rating</SelectItem>
              <SelectItem value="lowest">Lowest Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onEdit={() => onReviewEdit?.(review)}
            onDelete={handleReviewDeleted}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || isLoading}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
