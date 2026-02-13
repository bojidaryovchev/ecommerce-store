import { OrderDetailSkeleton } from "@/components/common";
import { OrderDetail } from "@/components/orders";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/queries/orders";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Order #${id.slice(0, 8).toUpperCase()} | Ecommerce Store`,
    description: "View order details",
  };
}

const OrderContent: React.FC<{ orderId: string; userId: string }> = async ({ orderId, userId }) => {
  const order = await getOrderById(orderId);

  if (!order || order.userId !== userId) {
    notFound();
  }

  return <OrderDetail order={order} />;
};

const OrderDetailPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<OrderDetailSkeleton />}>
        <OrderContent orderId={id} userId={session.user.id} />
      </Suspense>
    </main>
  );
};

export default OrderDetailPage;
