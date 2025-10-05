"use client";

import { getReviewStats } from "@/actions/get-review-stats.action";
import { Button } from "@/components/ui/button";
import type { ReviewStats } from "@/lib/review-utils";
import { formatRating, getRatingPercentage } from "@/lib/review-utils";
import { Filter, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { StarRatingDisplay } from "./star-rating";

interface ReviewSummaryProps {
  productId: string;
  onFilterChange?: (rating?: number) => void;
  selectedFilter?: number;
}

/**
 * Review Summary Component
 * - Shows average rating and total count
 * - Displays rating distribution with bars
 * - Filter buttons for each rating level
 */
export function ReviewSummary({ productId, onFilterChange, selectedFilter }: ReviewSummaryProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoading(true);
        const data = await getReviewStats(productId);
        setStats(data);
      } catch (error) {
        console.error("Failed to load review stats:", error);
        toast.error("Failed to load review statistics");
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [productId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="rounded-lg border bg-gray-50 p-8 text-center">
        <Star className="mx-auto mb-3 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No Reviews Yet</h3>
        <p className="text-gray-600">Be the first to review this product!</p>
      </div>
    );
  }

  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6">
      {/* Overall Rating */}
      <div className="flex items-start gap-6">
        <div className="text-center">
          <div className="mb-2 text-5xl font-bold text-gray-900">{formatRating(stats.averageRating)}</div>
          <StarRatingDisplay rating={stats.averageRating} size="lg" showValue={false} />
          <p className="mt-2 text-sm text-gray-600">
            Based on {stats.totalReviews.toLocaleString()} {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
          {stats.verifiedPurchaseCount > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {stats.verifiedPurchaseCount} verified {stats.verifiedPurchaseCount === 1 ? "purchase" : "purchases"}
            </p>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {ratings.map((rating) => {
            const count = stats.ratingDistribution[rating];
            const percentage = getRatingPercentage(count, stats.totalReviews);
            const isSelected = selectedFilter === rating;

            return (
              <button
                key={rating}
                onClick={() => onFilterChange?.(isSelected ? undefined : rating)}
                className={`group flex w-full items-center gap-3 rounded p-2 transition-colors hover:bg-gray-50 ${isSelected ? "border border-blue-200 bg-blue-50" : ""} `}
              >
                <div className="flex w-16 flex-shrink-0 items-center gap-1">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <Star className="h-4 w-4 flex-shrink-0 fill-yellow-400 stroke-yellow-400" />
                </div>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className={`h-full transition-all ${
                      isSelected ? "bg-blue-500" : "bg-yellow-400 group-hover:bg-yellow-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="w-16 text-right">
                  <span className="text-sm text-gray-600">
                    {count} ({percentage}%)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls */}
      {selectedFilter && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>Showing {selectedFilter}-star reviews</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => onFilterChange?.(undefined)}>
            Clear Filter
          </Button>
        </div>
      )}
    </div>
  );
}
