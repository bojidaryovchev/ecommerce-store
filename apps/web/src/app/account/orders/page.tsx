import { OrdersListSkeleton } from "@/components/common/skeletons/orders-list-skeleton";
import { OrderList } from "@/components/orders";
import { auth } from "@/lib/auth";
import { getOrdersByUserId } from "@/queries/orders";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Orders | My Account | Ecommerce Store",
  description: "View your order history",
};

const OrdersContent: React.FC<{ userId: string }> = async ({ userId }) => {
  const orders = await getOrdersByUserId(userId);

  return <OrderList orders={orders} />;
};

const OrdersPage: React.FC = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">Orders</h2>
        <p className="text-muted-foreground text-sm">View and track your order history.</p>
      </div>
      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersContent userId={session.user.id} />
      </Suspense>
    </div>
  );
};

export default OrdersPage;
