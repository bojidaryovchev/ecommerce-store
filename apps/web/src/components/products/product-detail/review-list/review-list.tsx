"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { deleteReview } from "@/mutations/reviews";
import type { getReviewsByProductId } from "@/queries/reviews";
import React, { useTransition } from "react";
import toast from "react-hot-toast";

type ReviewData = Awaited<ReturnType<typeof getReviewsByProductId>>;

interface Props {
  reviews: ReviewData;
  currentUserId?: string;
}

const ReviewList: React.FC<Props> = ({ reviews, currentUserId }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (reviewId: string) => {
    startTransition(async () => {
      const result = await deleteReview(reviewId);
      if (result.success) {
        toast.success("Review deleted");
      } else {
        toast.error(result.error);
      }
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="border-border rounded-lg border border-dashed py-8 text-center">
        <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reviews.map((review) => {
        const isOwn = currentUserId === review.user.id;
        return (
          <Card key={review.id}>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={review.user.image ?? undefined} alt={review.user.name ?? "User"} />
                    <AvatarFallback>{(review.user.name ?? "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {review.user.name ?? "Anonymous"}
                      {isOwn && <span className="text-muted-foreground ml-1 text-xs">(You)</span>}
                    </p>
                    <p className="text-muted-foreground text-xs">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < review.rating ? "text-yellow-400" : "text-gray-300"}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              {review.content && <p className="text-muted-foreground text-sm">{review.content}</p>}
              {isOwn && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-auto px-2 py-1 text-xs"
                    disabled={isPending}
                    onClick={() => handleDelete(review.id)}
                  >
                    Delete my review
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export { ReviewList };
