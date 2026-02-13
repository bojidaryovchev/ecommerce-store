import { OrdersListSkeleton } from "@/components/common/skeletons/orders-list-skeleton";
import React from "react";

const OrdersLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="bg-muted mb-8 h-9 w-40 animate-pulse rounded" />
      <OrdersListSkeleton />
    </main>
  );
};

export default OrdersLoading;
