import { AdminOrdersHeader, OrdersTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Orders | Admin",
};

type Props = {
  searchParams: Promise<{ status?: string; page?: string }>;
};

const AdminOrdersPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;

  const validStatuses = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
  const statusFilter = validStatuses.includes(params.status as (typeof validStatuses)[number])
    ? (params.status as (typeof validStatuses)[number])
    : undefined;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminOrdersHeader>
      <Suspense key={`${statusFilter}-${page}`} fallback={<TableSkeleton />}>
        <OrdersTableLoader status={statusFilter} page={page} />
      </Suspense>
    </AdminOrdersHeader>
  );
};

export default AdminOrdersPage;
