"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { AddToCartButton } from "./add-to-cart-button";

interface Props {
  productId: string;
  priceId: string | undefined;
  isActive: boolean;
  trackInventory: boolean;
  stockQuantity: number | null;
}

const ProductAddToCart: React.FC<Props> = ({ productId, priceId, isActive, trackInventory, stockQuantity }) => {
  if (!priceId) {
    return (
      <Button size="lg" className="w-full" disabled>
        Price Unavailable
      </Button>
    );
  }

  if (!isActive) {
    return (
      <Button size="lg" className="w-full" disabled>
        Currently Unavailable
      </Button>
    );
  }

  if (trackInventory && (stockQuantity === null || stockQuantity <= 0)) {
    return (
      <Button size="lg" className="w-full" disabled>
        Out of Stock
      </Button>
    );
  }

  return <AddToCartButton productId={productId} priceId={priceId} />;
};

export { ProductAddToCart };
