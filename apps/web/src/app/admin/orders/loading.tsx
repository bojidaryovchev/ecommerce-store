import { TableSkeleton } from "@/components/common";
import React from "react";

const AdminOrdersLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-muted h-9 w-32 animate-pulse rounded" />
        <div className="bg-muted h-9 w-40 animate-pulse rounded" />
      </div>
      <TableSkeleton />
    </div>
  );
};

export default AdminOrdersLoading;
