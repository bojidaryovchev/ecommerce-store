import { OrdersListSkeleton } from "@/components/common";
import React from "react";

const OrdersLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="bg-muted h-8 w-32 animate-pulse rounded" />
        <div className="bg-muted h-4 w-64 animate-pulse rounded" />
      </div>
      <OrdersListSkeleton />
    </div>
  );
};

export default OrdersLoading;
