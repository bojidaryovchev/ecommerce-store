"use client";

import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";
import { Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  productId: string;
  priceId: string;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

const AddToCartButton: React.FC<Props> = ({
  productId,
  priceId,
  disabled = false,
  className,
  size = "lg",
  variant = "default",
}) => {
  const t = useTranslations("products.addToCartButton");
  const { addItem, isLoading } = useCart();

  const handleClick = async () => {
    await addItem(productId, priceId, 1);
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={cn("w-full", className)}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
      {t("label")}
    </Button>
  );
};

export { AddToCartButton };
