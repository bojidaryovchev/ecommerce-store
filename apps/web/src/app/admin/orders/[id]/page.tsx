import { AdminOrderDetail } from "@/components/admin";
import { OrderDetailSkeleton } from "@/components/common";
import { getOrderById } from "@/queries/orders";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Order Detail | Admin",
};

type Props = {
  params: Promise<{ id: string }>;
};

const OrderContent: React.FC<{ orderId: string }> = async ({ orderId }) => {
  const order = await getOrderById(orderId);

  if (!order) {
    notFound();
  }

  return <AdminOrderDetail order={order} />;
};

const AdminOrderDetailPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <Suspense fallback={<OrderDetailSkeleton />}>
      <OrderContent orderId={id} />
    </Suspense>
  );
};

export default AdminOrderDetailPage;
