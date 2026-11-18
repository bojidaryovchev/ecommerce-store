import type { ProductWithPrices } from "@/types/product.type";
import { useTranslations } from "next-intl";
import React from "react";
import { ProductCard } from "./product-card";

const gridVariants = {
  // Two to a row from the smallest phones up: one card per screen makes a long scroll of a short list.
  default: "grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4",
  compact: "grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3",
};

interface Props {
  products: ProductWithPrices[];
  /** Defaults to a generic "no products found" message */
  emptyMessage?: string;
  wishlistedProductIds?: string[];
  /** Use "compact" for narrower containers like the account page */
  variant?: keyof typeof gridVariants;
}

const ProductsGrid: React.FC<Props> = ({ products, emptyMessage, wishlistedProductIds, variant = "default" }) => {
  const t = useTranslations("products.grid");

  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage ?? t("empty")}</p>
      </div>
    );
  }

  const wishlistSet = wishlistedProductIds ? new Set(wishlistedProductIds) : undefined;

  return (
    <div className={gridVariants[variant]}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
          isWishlisted={wishlistSet ? wishlistSet.has(product.id) : undefined}
        />
      ))}
    </div>
  );
};

export { ProductsGrid };
