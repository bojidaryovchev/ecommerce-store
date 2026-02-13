import { AdminOrdersHeader, OrdersTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Orders | Admin",
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

const AdminOrdersPage: React.FC<Props> = async ({ searchParams }) => {
  const { status } = await searchParams;

  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
  const statusFilter = validStatuses.includes(status as (typeof validStatuses)[number])
    ? (status as (typeof validStatuses)[number])
    : undefined;

  return (
    <AdminOrdersHeader>
      <Suspense fallback={<TableSkeleton />}>
        <OrdersTableLoader status={statusFilter} />
      </Suspense>
    </AdminOrdersHeader>
  );
};

export default AdminOrdersPage;
