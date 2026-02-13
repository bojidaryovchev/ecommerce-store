import { ProductsGridSkeleton } from "@/components/common";
import React from "react";

const ProductsLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-muted mb-8 h-9 w-32 animate-pulse rounded" />
      <ProductsGridSkeleton />
    </main>
  );
};

export default ProductsLoading;
