import { AdminCouponsHeader, CouponsTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Coupons | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminCouponsPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminCouponsHeader>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <CouponsTableLoader page={page} />
      </Suspense>
    </AdminCouponsHeader>
  );
};

export default AdminCouponsPage;
