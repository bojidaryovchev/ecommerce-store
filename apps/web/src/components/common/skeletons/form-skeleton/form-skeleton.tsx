import React from "react";

interface Props {
  rows?: number;
}

const FormSkeleton: React.FC<Props> = ({ rows = 6 }) => {
  return (
    <div className="max-w-2xl space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-muted h-12 animate-pulse rounded" />
      ))}
    </div>
  );
};

export { FormSkeleton };
