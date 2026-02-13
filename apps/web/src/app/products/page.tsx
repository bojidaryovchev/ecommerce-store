import { ProductsGridSkeleton } from "@/components/common";
import { AllProducts } from "@/components/products";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | Ecommerce Store",
  description: "Browse our products",
};

const ProductsPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Products</h1>
      <Suspense fallback={<ProductsGridSkeleton />}>
        <AllProducts />
      </Suspense>
    </main>
  );
};

export default ProductsPage;
