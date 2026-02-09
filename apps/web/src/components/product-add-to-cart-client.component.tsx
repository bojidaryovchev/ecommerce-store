"use client";

import AddToCartButton from "@/components/add-to-cart-button.component";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  productId: string;
  priceId: string | undefined;
  isActive: boolean;
}

const ProductAddToCartClient: React.FC<Props> = ({ productId, priceId, isActive }) => {
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

  return <AddToCartButton productId={productId} priceId={priceId} />;
};

export default ProductAddToCartClient;
