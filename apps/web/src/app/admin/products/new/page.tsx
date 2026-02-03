import ProductForm from "@/components/admin/product-form.component";
import { getCategories } from "@/lib/queries/categories";
import React, { Suspense } from "react";

const NewProductPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Add New Product</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ProductFormLoader />
      </Suspense>
    </div>
  );
};

const ProductFormLoader: React.FC = async () => {
  const categories = await getCategories();
  return <ProductForm categories={categories} />;
};

const FormSkeleton: React.FC = () => {
  return (
    <div className="max-w-2xl space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-muted h-12 animate-pulse rounded" />
      ))}
    </div>
  );
};

export default NewProductPage;
