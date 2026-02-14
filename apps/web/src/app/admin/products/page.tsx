import { AdminProductsHeader, ProductsTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminProductsPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminProductsHeader>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <ProductsTableLoader page={page} />
      </Suspense>
    </AdminProductsHeader>
  );
};

export default AdminProductsPage;
