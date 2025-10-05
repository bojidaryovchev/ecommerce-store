"use client";

import { createReview } from "@/actions/create-review.action";
import { updateReview } from "@/actions/update-review.action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { StarRating } from "./star-rating";

interface ReviewFormProps {
  productId: string;
  existingReview?: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
  } | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Review Form Component
 * - Create new reviews or edit existing ones
 * - Star rating input
 * - Title and comment fields
 * - Form validation
 */
export function ReviewForm({ productId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!existingReview;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (comment.length < 10) {
      toast.error("Comment must be at least 10 characters");
      return;
    }

    try {
      setIsSubmitting(true);

      if (isEditing) {
        await updateReview(existingReview.id, {
          rating,
          title: title || null,
          comment: comment || null,
        });
        toast.success("Review updated successfully! It will be visible after admin approval.");
      } else {
        await createReview({
          productId,
          rating,
          title: title || null,
          comment: comment || null,
        });
        toast.success("Review submitted successfully!");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Failed to submit review:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Rating Input */}
      <div className="space-y-2">
        <Label htmlFor="rating" className="text-base font-semibold">
          Your Rating *
        </Label>
        <div className="flex items-center gap-4">
          <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          {rating > 0 && <span className="text-sm text-gray-600">{rating} out of 5 stars</span>}
        </div>
      </div>

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-base font-semibold">
          Review Title <span className="text-sm font-normal text-gray-500">(optional)</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
          maxLength={100}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">{title.length}/100 characters</p>
      </div>

      {/* Comment Input */}
      <div className="space-y-2">
        <Label htmlFor="comment" className="text-base font-semibold">
          Your Review *
        </Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience with this product..."
          rows={6}
          maxLength={2000}
          disabled={isSubmitting}
          className="resize-none"
        />
        <p className="text-xs text-gray-500">{comment.length}/2000 characters (minimum 10)</p>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || rating === 0} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Submitting..."}
            </>
          ) : isEditing ? (
            "Update Review"
          ) : (
            "Submit Review"
          )}
        </Button>

        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>

      {/* Help Text */}
      <p className="text-xs text-gray-500">
        {isEditing
          ? "Edited reviews require admin approval before becoming visible."
          : "Your review will be visible after admin approval."}
      </p>
    </form>
  );
}
