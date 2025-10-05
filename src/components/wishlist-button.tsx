"use client";

import { addToWishlist } from "@/actions/add-to-wishlist.action";
import { checkWishlistStatus } from "@/actions/check-wishlist.action";
import { removeFromWishlist } from "@/actions/remove-from-wishlist.action";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface WishlistButtonProps {
  productId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
  className?: string;
}

export function WishlistButton({
  productId,
  variant = "ghost",
  size = "icon",
  showText = false,
  className,
}: WishlistButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if product is in wishlist
  useEffect(() => {
    async function checkStatus() {
      if (status === "authenticated") {
        setIsChecking(true);
        const result = await checkWishlistStatus(productId);
        if (result.success) {
          setIsInWishlist(result.isInWishlist);
        }
        setIsChecking(false);
      } else if (status === "unauthenticated") {
        setIsChecking(false);
      }
    }
    checkStatus();
  }, [productId, status]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect to sign in if not authenticated
    if (!session?.user) {
      router.push("/api/auth/signin");
      return;
    }

    setIsLoading(true);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const result = await removeFromWishlist({ productId });
        if (result.error) {
          toast.error(result.error);
        } else {
          setIsInWishlist(false);
          toast.success("Removed from wishlist");
        }
      } else {
        // Add to wishlist
        const result = await addToWishlist({ productId });
        if (result.error) {
          toast.error(result.error);
        } else {
          setIsInWishlist(true);
          toast.success("Added to wishlist");
        }
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading || isChecking}
      className={cn("relative", className)}
      aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-all",
          isInWishlist && "fill-red-500 text-red-500",
          isLoading && "animate-pulse",
        )}
      />
      {showText && <span className="ml-2">{isInWishlist ? "In Wishlist" : "Add to Wishlist"}</span>}
    </Button>
  );
}
