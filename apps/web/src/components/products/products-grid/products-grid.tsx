import type { ProductWithPrices } from "@/types/product.type";
import React from "react";
import { ProductCard } from "./product-card";

const gridVariants = {
  default: "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  compact: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3",
};

interface Props {
  products: ProductWithPrices[];
  emptyMessage?: string;
  wishlistedProductIds?: string[];
  /** Use "compact" for narrower containers like the account page */
  variant?: keyof typeof gridVariants;
}

const ProductsGrid: React.FC<Props> = ({
  products,
  emptyMessage = "No products found",
  wishlistedProductIds,
  variant = "default",
}) => {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">{emptyMessage}</p>
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
