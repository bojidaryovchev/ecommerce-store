import { ProductDetailSkeleton } from "@/components/common";
import React from "react";

const ProductLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <ProductDetailSkeleton />
    </main>
  );
};

export default ProductLoading;
