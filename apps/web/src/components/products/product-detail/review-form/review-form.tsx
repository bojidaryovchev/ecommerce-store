"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/mutations/reviews";
import { useTranslations } from "next-intl";
import React, { useCallback, useState, useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  productId: string;
}

const ReviewForm: React.FC<Props> = ({ productId }) => {
  const t = useTranslations("products.reviewForm");
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [content, setContent] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (rating === 0) {
        toast.error(t("ratingRequired"));
        return;
      }

      startTransition(async () => {
        const result = await createReview({
          productId,
          rating,
          content: content.trim() || undefined,
        });

        if (result.success) {
          toast.success(t("submitted"));
          setRating(0);
          setContent("");
        } else {
          toast.error(result.error);
        }
      });
    },
    [productId, rating, content, t],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star Rating */}
      <div className="space-y-2">
        <Label>{t("rating")}</Label>
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            return (
              <button
                key={i}
                type="button"
                className="text-2xl transition-colors"
                onClick={() => setRating(starValue)}
                onMouseEnter={() => setHoveredRating(starValue)}
                onMouseLeave={() => setHoveredRating(0)}
                aria-label={t("rateStars", { count: starValue })}
              >
                <span className={starValue <= (hoveredRating || rating) ? "text-yellow-400" : "text-gray-300"}>★</span>
              </button>
            );
          })}
          {rating > 0 && <span className="text-muted-foreground ml-2 text-sm">{rating} / 5</span>}
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <Label htmlFor="review-content">{t("content")}</Label>
        <Textarea
          id="review-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("contentPlaceholder")}
          rows={3}
          maxLength={2000}
        />
      </div>

      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};

export { ReviewForm };
