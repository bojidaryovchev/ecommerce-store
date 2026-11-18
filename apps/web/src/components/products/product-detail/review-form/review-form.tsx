"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createReview } from "@/mutations/reviews";
import { reviewSchema, type ReviewInput } from "@/schemas/review.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";

interface Props {
  productId: string;
}

/** A verified buyer's review: React Hook Form with the schema the action checks again. */
const ReviewForm: React.FC<Props> = ({ productId }) => {
  const t = useTranslations("products.reviewForm");
  const [hoveredRating, setHoveredRating] = useState(0);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, content: "" },
  });

  const onSubmit = async (values: ReviewInput) => {
    const result = await createReview({ ...values, productId });
    if (result.success) {
      toast.success(t("submitted"));
      reset();
    } else {
      toast.error(t(`errors.${result.error}`));
    }
  };
  const message = (key: "rating" | "content") =>
    errors[key]?.message ? t(`errors.${errors[key]!.message as "rating"}`) : undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label id="review-rating-label">{t("rating")}</Label>
        <Controller
          control={control}
          name="rating"
          render={({ field }) => (
            <div
              className="flex items-center gap-1"
              role="radiogroup"
              aria-labelledby="review-rating-label"
              aria-invalid={Boolean(message("rating"))}
              aria-describedby={message("rating") ? "review-rating-error" : undefined}
            >
              {Array.from({ length: 5 }).map((_, i) => {
                const starValue = i + 1;
                return (
                  <button
                    key={starValue}
                    type="button"
                    role="radio"
                    aria-checked={field.value === starValue}
                    className="grid size-10 place-items-center text-2xl transition-colors"
                    onClick={() => field.onChange(starValue)}
                    onMouseEnter={() => setHoveredRating(starValue)}
                    onMouseLeave={() => setHoveredRating(0)}
                    aria-label={t("rateStars", { count: starValue })}
                  >
                    <span className={starValue <= (hoveredRating || field.value) ? "text-yellow-400" : "text-gray-300"}>
                      ★
                    </span>
                  </button>
                );
              })}
              {field.value > 0 && <span className="text-muted-foreground ml-2 text-sm">{field.value} / 5</span>}
            </div>
          )}
        />
        {message("rating") && (
          <p id="review-rating-error" className="text-destructive text-sm">
            {message("rating")}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-content">{t("content")}</Label>
        <Textarea
          id="review-content"
          {...register("content")}
          placeholder={t("contentPlaceholder")}
          rows={3}
          maxLength={2000}
          aria-invalid={Boolean(message("content"))}
          aria-describedby={message("content") ? "review-content-error" : undefined}
        />
        {message("content") && (
          <p id="review-content-error" className="text-destructive text-sm">
            {message("content")}
          </p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
};

export { ReviewForm };
