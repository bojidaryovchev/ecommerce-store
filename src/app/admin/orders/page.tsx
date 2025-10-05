import { getOrders } from "@/actions/get-orders.action";
import OrdersList from "@/components/orders-list";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage customer orders",
};

const OrdersPage: React.FC = async () => {
  const { orders } = await getOrders();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and track customer orders</p>
        </div>
      </div>

      {/* Orders List */}
      <OrdersList orders={orders} />
    </div>
  );
};

export default OrdersPage;
