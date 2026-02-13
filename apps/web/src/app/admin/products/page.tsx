import { AdminProductsHeader, ProductsTableLoader } from "@/components/admin";
import { TableSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | Admin",
};

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
