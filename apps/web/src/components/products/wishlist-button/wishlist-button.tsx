"use client";

import { Button } from "@/components/ui/button";
import { toggleWishlist } from "@/mutations/wishlist";
import { Heart } from "lucide-react";
import React, { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";

interface Props {
  productId: string;
  isWishlisted: boolean;
  /** Render as icon-only (for product cards) or with label (for PDP) */
  variant?: "icon" | "labeled";
}

const WishlistButton: React.FC<Props> = ({ productId, isWishlisted, variant = "icon" }) => {
  const [isPending, startTransition] = useTransition();
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  // Sync with server prop when it changes (e.g. after navigation or revalidation)
  useEffect(() => {
    setWishlisted(isWishlisted);
  }, [isWishlisted]);

  const handleToggle = (e: React.MouseEvent) => {
    // Prevent navigation when clicking heart on product cards (which are links)
    e.preventDefault();
    e.stopPropagation();

    const newValue = !wishlisted;
    setWishlisted(newValue);

    startTransition(async () => {
      const result = await toggleWishlist(productId);
      if (!result.success) {
        // Roll back on failure
        setWishlisted(!newValue);
        toast.error(result.error ?? "Failed to update wishlist");
      } else if (result.data.wishlisted) {
        toast.success("Added to wishlist");
      } else {
        toast.success("Removed from wishlist");
      }
    });
  };

  if (variant === "labeled") {
    return (
      <Button variant="outline" onClick={handleToggle} disabled={isPending} className="gap-2">
        <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
        {wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isPending}
      className="absolute top-2 left-2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
    </Button>
  );
};

export { WishlistButton };
