"use client";

import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("products.productAddToCart");

  if (!priceId) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("priceOnRequest")}
      </Button>
    );
  }

  if (!isActive) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("currentlyUnavailable")}
      </Button>
    );
  }

  if (trackInventory && (stockQuantity === null || stockQuantity <= 0)) {
    return (
      <Button size="lg" className="w-full" disabled>
        {t("outOfStock")}
      </Button>
    );
  }

  return <AddToCartButton productId={productId} priceId={priceId} />;
};

export { ProductAddToCart };
