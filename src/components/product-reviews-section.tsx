"use client";

import { getUserReview } from "@/actions/get-reviews.action";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReviewWithUser } from "@/lib/review-utils";
import { MessageSquare, PenLine } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { ReviewForm } from "./review-form";
import { ReviewSummary } from "./review-summary";
import { ReviewsList } from "./reviews-list";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

/**
 * Complete Product Reviews Section
 * - Review summary with statistics
 * - Write/Edit review modal
 * - Reviews list with filtering and pagination
 */
export function ProductReviewsSection({ productId, productName }: ProductReviewsSectionProps) {
  const { data: session } = useSession();
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [userReview, setUserReview] = useState<ReviewWithUser | null>(null);
  const [filterRating, setFilterRating] = useState<number | undefined>();
  const [reviewToEdit, setReviewToEdit] = useState<ReviewWithUser | null>(null);

  // Load user's existing review if logged in
  useEffect(() => {
    const loadUserReview = async () => {
      if (!session?.user?.id) return;

      try {
        const review = await getUserReview(productId, session.user.id);
        setUserReview(review);
      } catch (error) {
        console.error("Failed to load user review:", error);
      }
    };

    loadUserReview();
  }, [productId, session?.user?.id]);

  const handleReviewSuccess = () => {
    setShowReviewDialog(false);
    setReviewToEdit(null);
    toast.success("Review submitted successfully!");
    // Reload user review
    if (session?.user?.id) {
      getUserReview(productId, session.user.id).then(setUserReview);
    }
  };

  const handleEditReview = (review: ReviewWithUser) => {
    setReviewToEdit(review);
    setShowReviewDialog(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setReviewToEdit(null);
    }
    setShowReviewDialog(open);
  };

  const isLoggedIn = !!session?.user?.id;
  const hasReviewed = !!userReview;
  const canWriteReview = isLoggedIn && !hasReviewed;

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <MessageSquare className="h-6 w-6" />
            Customer Reviews
          </h2>
          <p className="mt-1 text-gray-600">See what others think about {productName}</p>
        </div>

        {/* Write Review Button */}
        <Dialog open={showReviewDialog} onOpenChange={handleDialogClose}>
          <DialogTrigger asChild>
            <Button disabled={!canWriteReview && !hasReviewed} className="gap-2">
              <PenLine className="h-4 w-4" />
              {hasReviewed ? "Edit Review" : "Write a Review"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{reviewToEdit || hasReviewed ? "Edit Your Review" : "Write a Review"}</DialogTitle>
              <DialogDescription>
                Share your experience with this product to help others make informed decisions.
              </DialogDescription>
            </DialogHeader>
            <ReviewForm
              productId={productId}
              existingReview={reviewToEdit || userReview}
              onSuccess={handleReviewSuccess}
              onCancel={() => handleDialogClose(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Review Summary */}
      <ReviewSummary productId={productId} onFilterChange={setFilterRating} selectedFilter={filterRating} />

      {/* Reviews List */}
      <div>
        <h3 className="mb-4 text-xl font-semibold text-gray-900">All Reviews</h3>
        <ReviewsList
          productId={productId}
          onReviewEdit={handleEditReview}
          filterRating={filterRating}
          verifiedOnly={false}
        />
      </div>

      {/* Login Prompt for Non-logged-in Users */}
      {!isLoggedIn && (
        <div className="rounded-lg border bg-blue-50 p-6 text-center">
          <p className="mb-3 text-gray-700">Want to write a review?</p>
          <Button variant="outline" onClick={() => (window.location.href = "/api/auth/signin")}>
            Sign In to Write a Review
          </Button>
        </div>
      )}
    </div>
  );
}
