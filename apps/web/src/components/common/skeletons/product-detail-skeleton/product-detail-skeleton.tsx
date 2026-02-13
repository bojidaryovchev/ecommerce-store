import React from "react";

const ProductDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="bg-muted h-4 w-64 animate-pulse rounded" />

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image skeleton */}
        <div className="bg-muted aspect-square animate-pulse rounded-lg" />

        {/* Details skeleton */}
        <div className="space-y-4">
          <div className="bg-muted h-8 w-3/4 animate-pulse rounded" />
          <div className="bg-muted h-6 w-1/4 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-full animate-pulse rounded" />
            <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
          </div>
          <div className="bg-muted h-12 w-full animate-pulse rounded" />
        </div>
      </div>
    </div>
  );
};

export { ProductDetailSkeleton };
