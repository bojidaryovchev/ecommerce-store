import type { ProductWithPrices } from "@/types/category.type";
import React from "react";
import { ProductCard } from "./product-card";

interface Props {
  products: ProductWithPrices[];
}

const ProductsGrid: React.FC<Props> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No products found in this category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} />
      ))}
    </div>
  );
};

export { ProductsGrid };
