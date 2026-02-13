import { OrdersListSkeleton } from "@/components/common/skeletons/orders-list-skeleton";
import { OrderList } from "@/components/orders";
import { auth } from "@/lib/auth";
import { getOrdersByUserId } from "@/queries/orders";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "My Orders | Ecommerce Store",
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
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">My Orders</h1>
      <Suspense fallback={<OrdersListSkeleton />}>
        <OrdersContent userId={session.user.id} />
      </Suspense>
    </main>
  );
};

export default OrdersPage;
