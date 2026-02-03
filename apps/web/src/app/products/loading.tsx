import React from "react";

const ProductsLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-muted mb-8 h-9 w-32 animate-pulse rounded" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="bg-muted aspect-square animate-pulse rounded-lg" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </main>
  );
};

export default ProductsLoading;
