import React from "react";

type Props = {
  rows?: number;
};

const OrdersListSkeleton: React.FC<Props> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="bg-muted/50 flex h-10 items-center gap-4 rounded px-2">
        <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        <div className="bg-muted h-4 w-28 animate-pulse rounded" />
        <div className="bg-muted h-4 w-20 animate-pulse rounded" />
        <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        <div className="bg-muted ml-auto h-4 w-20 animate-pulse rounded" />
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex h-14 items-center gap-4 border-b px-2">
          <div className="bg-muted h-4 w-20 animate-pulse rounded" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded" />
          <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
          <div className="bg-muted h-4 w-14 animate-pulse rounded" />
          <div className="bg-muted ml-auto h-4 w-16 animate-pulse rounded" />
          <div className="bg-muted h-8 w-14 animate-pulse rounded" />
        </div>
      ))}
    </div>
  );
};

export { OrdersListSkeleton };
