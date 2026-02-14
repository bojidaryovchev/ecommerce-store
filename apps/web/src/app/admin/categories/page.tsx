import { AdminCategoriesHeader, CategoriesTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Admin",
};

type Props = {
  searchParams: Promise<{ page?: string }>;
};

const AdminCategoriesPage: React.FC<Props> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <AdminCategoriesHeader>
      <Suspense key={page} fallback={<TableSkeleton />}>
        <CategoriesTableLoader page={page} />
      </Suspense>
    </AdminCategoriesHeader>
  );
};

export default AdminCategoriesPage;
