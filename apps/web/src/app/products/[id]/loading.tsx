import { ProductDetailSkeleton } from "@/components/common";
import React from "react";

const ProductLoading: React.FC = () => {
  return (
    <main className="max-w-container py-8">
      <ProductDetailSkeleton />
    </main>
  );
};

export default ProductLoading;
