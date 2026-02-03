import ProductsGrid from "@/components/products-grid.component";
import { getProducts } from "@/lib/queries/products";
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
        <ProductsGridLoader />
      </Suspense>
    </main>
  );
};

const ProductsGridLoader: React.FC = async () => {
  const products = await getProducts();
  return <ProductsGrid products={products} />;
};

const ProductsGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="bg-muted aspect-square animate-pulse rounded-lg" />
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
};

export default ProductsPage;
