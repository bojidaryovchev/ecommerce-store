import React from "react";

const ProductLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted aspect-square animate-pulse rounded-lg" />
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="bg-muted h-8 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-6 w-1/4 animate-pulse rounded" />
          </div>
          <div className="space-y-2">
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-12 w-full animate-pulse rounded" />
        </div>
      </div>
    </main>
  );
};

export default ProductLoading;
