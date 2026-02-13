import { OrderDetailSkeleton } from "@/components/common/skeletons/order-detail-skeleton";
import React from "react";

const OrderLoading: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <OrderDetailSkeleton />
    </main>
  );
};

export default OrderLoading;
