import React from "react";

const CategoryDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Breadcrumb skeleton */}
      <div className="bg-muted h-4 w-64 animate-pulse rounded" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="bg-muted h-8 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-96 animate-pulse rounded" />
      </div>

      {/* Products grid skeleton */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="bg-muted aspect-square animate-pulse rounded-lg" />
            <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-4 w-1/2 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export { CategoryDetailSkeleton };
