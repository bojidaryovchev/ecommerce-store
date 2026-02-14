import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { auth } from "@/lib/auth";
import { checkUserAlreadyReviewed, checkUserPurchasedProduct, getReviewsByProductId } from "@/queries/reviews";
import React from "react";
import { ReviewForm } from "../review-form";
import { ReviewList } from "../review-list";

interface Props {
  productId: string;
}

const ReviewSection: React.FC<Props> = async ({ productId }) => {
  const [reviews, session] = await Promise.all([getReviewsByProductId(productId), auth()]);

  const userId = session?.user?.id;

  let hasPurchased = false;
  let alreadyReviewed = false;

  if (userId) {
    [hasPurchased, alreadyReviewed] = await Promise.all([
      checkUserPurchasedProduct(userId, productId),
      checkUserAlreadyReviewed(userId, productId),
    ]);
  }

  const canReview = !!userId && hasPurchased && !alreadyReviewed;

  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-sm ${i < Math.round(averageRating) ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-muted-foreground text-sm">
              {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
            </span>
          </div>
        )}
      </div>

      {/* Review Form */}
      {canReview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm productId={productId} />
            </CardContent>
          </Card>
          <Separator />
        </>
      )}

      {alreadyReviewed && (
        <p className="text-muted-foreground text-sm">
          You have already reviewed this product. Delete your review below to leave a new one.
        </p>
      )}

      {!userId && <p className="text-muted-foreground text-sm">Sign in and purchase this product to leave a review.</p>}

      {userId && !hasPurchased && (
        <p className="text-muted-foreground text-sm">Purchase this product to leave a review.</p>
      )}

      {/* Reviews List */}
      <ReviewList reviews={reviews} currentUserId={userId} />
    </section>
  );
};

export { ReviewSection };
