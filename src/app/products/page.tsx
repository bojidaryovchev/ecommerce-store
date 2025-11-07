import ProductsList from "@/components/products-list.component";
import React, { Suspense } from "react";

const ProductsLoading: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="aspect-square animate-pulse bg-gray-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
};

const ProductsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="mt-2 text-gray-600">Browse our collection of products</p>
      </div>
      <Suspense fallback={<ProductsLoading />}>
        <ProductsList />
      </Suspense>
    </div>
  );
};

export default ProductsPage;
