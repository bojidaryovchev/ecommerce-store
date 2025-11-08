import { prismaGetOrders } from "@/actions/prisma-get-orders.action";
import AdminOrdersListClient from "@/components/admin-orders-list-client.component";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const AdminOrdersPage: React.FC = async () => {
  const session = await auth();

  // Check if user is authenticated and has admin role
  if (!session || (!session.user.roles.includes("ADMIN") && !session.user.roles.includes("SUPER_ADMIN"))) {
    redirect("/");
  }

  // Get all orders (no userId filter for admin view)
  const ordersResult = await prismaGetOrders();

  if (!ordersResult.success) {
    return <div>Error loading orders: {ordersResult.error}</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <AdminOrdersListClient orders={ordersResult.data} />
    </div>
  );
};

export default AdminOrdersPage;
