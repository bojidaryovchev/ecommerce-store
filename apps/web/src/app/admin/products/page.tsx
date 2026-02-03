import AdminProductsHeader from "@/components/admin/admin-products-header.component";
import ProductsTable from "@/components/admin/products-table.component";
import { getAllProducts } from "@/lib/queries/products";
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

const ProductsTableLoader: React.FC = async () => {
  const products = await getAllProducts();
  return <ProductsTable products={products} />;
};

const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-muted h-16 animate-pulse rounded" />
      ))}
    </div>
  );
};

export default AdminProductsPage;
