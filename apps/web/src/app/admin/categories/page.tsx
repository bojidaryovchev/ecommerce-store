import { AdminCategoriesHeader, CategoriesTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import React, { Suspense } from "react";

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
