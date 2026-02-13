import React from "react";

interface Props {
  rows?: number;
}

const TableSkeleton: React.FC<Props> = ({ rows = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-muted h-16 animate-pulse rounded" />
      ))}
    </div>
  );
};

export { TableSkeleton };
