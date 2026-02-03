import CategoryForm from "@/components/admin/category-form.component";
import { getRootCategories } from "@/lib/queries/categories";
import React, { Suspense } from "react";

const NewCategoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Category</h1>
      <Suspense fallback={<FormSkeleton />}>
        <CategoryFormLoader />
      </Suspense>
    </div>
  );
};

const CategoryFormLoader: React.FC = async () => {
  const categories = await getRootCategories();
  return <CategoryForm parentCategories={categories} />;
};

const FormSkeleton: React.FC = () => {
  return (
    <div className="max-w-xl space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-muted h-12 animate-pulse rounded" />
      ))}
    </div>
  );
};

export default NewCategoryPage;
