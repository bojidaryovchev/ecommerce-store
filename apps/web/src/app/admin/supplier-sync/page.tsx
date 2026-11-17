import { SupplierSyncHeader, SupplierSyncOverview, SyncChangesLoader } from "@/components/admin/supplier-sync";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Supplier sync | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminSupplierSyncPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <SupplierSyncHeader>
      <Suspense fallback={<TableSkeleton />}>
        <SupplierSyncOverview />
      </Suspense>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <SyncChangesLoader page={page} />
      </Suspense>
    </SupplierSyncHeader>
  );
};

export default AdminSupplierSyncPage;
