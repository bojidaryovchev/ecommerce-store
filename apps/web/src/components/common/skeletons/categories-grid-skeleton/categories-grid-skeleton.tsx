import React from "react";

interface Props {
  count?: number;
}

const CategoriesGridSkeleton: React.FC<Props> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-muted aspect-square animate-pulse rounded-lg" />
      ))}
    </div>
  );
};

export { CategoriesGridSkeleton };
