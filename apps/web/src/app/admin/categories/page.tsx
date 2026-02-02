import AdminCategoriesHeader from "@/components/admin/admin-categories-header.component";
import CategoriesTable from "@/components/admin/categories-table.component";
import { getCategories } from "@/lib/queries/categories";
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

const CategoriesTableLoader: React.FC = async () => {
  const categories = await getCategories();
  return <CategoriesTable categories={categories} />;
};

const TableSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-default-100 h-16 animate-pulse rounded" />
      ))}
    </div>
  );
};

export default AdminCategoriesPage;
