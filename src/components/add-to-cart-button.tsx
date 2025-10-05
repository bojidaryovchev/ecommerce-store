"use client";

import { Button } from "@/components/ui/button";
import { useCartContext } from "@/contexts/cart-context";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import type React from "react";
import { useState } from "react";
import toast from "react-hot-toast";

interface AddToCartButtonProps {
  productId: string;
  variantId?: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showIcon?: boolean;
  children?: React.ReactNode;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  variantId,
  quantity = 1,
  disabled = false,
  className,
  size = "default",
  variant = "default",
  showIcon = true,
  children,
}) => {
  const { addItem } = useCartContext();
  const [isAdding, setIsAdding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      await addItem({
        productId,
        variantId,
        quantity,
      });

      // Show success state
      setShowSuccess(true);
      toast.success("Added to cart!");

      // Reset success state after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={handleAddToCart}
      disabled={disabled || isAdding}
      className={className}
      size={size}
      variant={variant}
    >
      {isAdding ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding...
        </>
      ) : showSuccess ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added!
        </>
      ) : (
        <>
          {showIcon && <ShoppingCart className="mr-2 h-4 w-4" />}
          {children || "Add to Cart"}
        </>
      )}
    </Button>
  );
};

export default AddToCartButton;
