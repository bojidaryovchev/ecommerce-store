import { AdminProductsHeader, ProductsTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import React, { Suspense } from "react";

const AdminProductsPage: React.FC = () => {
  return (
    <AdminProductsHeader>
      <Suspense fallback={<TableSkeleton />}>
        <ProductsTableLoader />
      </Suspense>
    </AdminProductsHeader>
  );
};

export default AdminProductsPage;
