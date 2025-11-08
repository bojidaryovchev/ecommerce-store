import { prismaGetOrders } from "@/actions/prisma-get-orders.action";
import OrdersList from "@/components/orders-list.component";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

const OrdersPage: React.FC = async () => {
  const session = await auth();

  // Require authentication to view orders
  if (!session?.user?.id) {
    redirect("/");
  }

  // Get orders filtered by userId
  const result = await prismaGetOrders({ userId: session.user.id });

  if (!result.success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="py-12 text-center">
          <p className="mb-4 text-red-600">Failed to load orders</p>
          <Link href="/products">
            <Button>Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
      <OrdersList orders={result.data} />
    </div>
  );
};

export default OrdersPage;
