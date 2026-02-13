import { AdminCategoriesHeader, CategoriesTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Admin",
};

const AdminCategoriesPage: React.FC = () => {
  return (
    <AdminCategoriesHeader>
      <Suspense fallback={<TableSkeleton />}>
        <CategoriesTableLoader />
      </Suspense>
    </AdminCategoriesHeader>
  );
};

export default AdminCategoriesPage;
