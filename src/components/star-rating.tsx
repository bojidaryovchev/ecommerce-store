"use client";

import { Star } from "lucide-react";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showLabel?: boolean;
  className?: string;
}

/**
 * Star Rating Component
 * - Displays star ratings with half-star support
 * - Interactive mode for rating input
 * - Read-only mode for display
 */
export function StarRating({
  rating,
  onRatingChange,
  size = "md",
  readonly = false,
  showLabel = false,
  className = "",
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const displayRating = hoverRating ?? rating;

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly && onRatingChange) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(null);
    }
  };

  const getRatingLabel = (rating: number): string => {
    if (rating >= 4.5) return "Excellent";
    if (rating >= 3.5) return "Good";
    if (rating >= 2.5) return "Average";
    if (rating >= 1.5) return "Poor";
    return "Very Poor";
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayRating >= star;
          const isHalf = displayRating >= star - 0.5 && displayRating < star;

          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              className={`relative transition-all ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} ${sizeClasses[size]} `}
              aria-label={`Rate ${star} stars`}
            >
              {/* Background (empty) star */}
              <Star
                className={`absolute inset-0 ${isFilled || isHalf ? "fill-yellow-400 stroke-yellow-400" : "fill-none stroke-gray-300"} `}
              />
              {/* Half star overlay */}
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="fill-yellow-400 stroke-yellow-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showLabel && (
        <span className="ml-1 text-sm text-gray-600">
          {rating.toFixed(1)} - {getRatingLabel(rating)}
        </span>
      )}
    </div>
  );
}

/**
 * Star Rating Display (Read-only version with count)
 */
interface StarRatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export function StarRatingDisplay({
  rating,
  count,
  size = "md",
  showValue = true,
  className = "",
}: StarRatingDisplayProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <StarRating rating={rating} size={size} readonly />
      {showValue && (
        <div className="flex items-center gap-1 text-sm">
          <span className="font-medium text-gray-900">{rating.toFixed(1)}</span>
          {count !== undefined && <span className="text-gray-500">({count.toLocaleString()})</span>}
        </div>
      )}
    </div>
  );
}
