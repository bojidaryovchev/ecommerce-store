import React from "react";
import { ProductsGridSkeleton } from "../products-grid-skeleton";

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
      <ProductsGridSkeleton />
    </div>
  );
};

export { CategoryDetailSkeleton };
