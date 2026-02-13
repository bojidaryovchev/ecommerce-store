import React from "react";

const OrderDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="bg-muted h-8 w-36 animate-pulse rounded" />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-9 w-64 animate-pulse rounded" />
          <div className="bg-muted h-4 w-48 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items card */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-20 animate-pulse rounded" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="bg-muted h-16 w-16 animate-pulse rounded-md" />
                  <div className="flex-1 space-y-2">
                    <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
                    <div className="bg-muted h-3 w-1/3 animate-pulse rounded" />
                  </div>
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar cards */}
        <div className="space-y-6">
          {/* Summary card */}
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-24 animate-pulse rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-16 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Address card */}
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-36 animate-pulse rounded" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-muted h-4 w-full animate-pulse rounded" />
              ))}
            </div>
          </div>

          {/* Timeline card */}
          <div className="rounded-lg border p-6">
            <div className="bg-muted mb-4 h-6 w-24 animate-pulse rounded" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="bg-muted h-4 w-20 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-28 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OrderDetailSkeleton };
