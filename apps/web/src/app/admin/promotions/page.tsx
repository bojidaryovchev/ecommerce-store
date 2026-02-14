import { AdminPromotionsHeader, PromotionsTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Promotion Codes | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminPromotionsPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminPromotionsHeader>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <PromotionsTableLoader page={page} />
      </Suspense>
    </AdminPromotionsHeader>
  );
};

export default AdminPromotionsPage;
