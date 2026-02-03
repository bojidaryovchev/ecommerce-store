import CategoryForm from "@/components/admin/category-form.component";
import { getCategories, getCategoryById } from "@/lib/queries/categories";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

const EditCategoryPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Category</h1>
      <Suspense fallback={<FormSkeleton />}>
        <CategoryFormLoader id={id} />
      </Suspense>
    </div>
  );
};

interface LoaderProps {
  id: string;
}

const CategoryFormLoader: React.FC<LoaderProps> = async ({ id }) => {
  const [category, categories] = await Promise.all([getCategoryById(id), getCategories()]);

  if (!category) {
    notFound();
  }

  // Filter out current category and its children from parent options
  const parentCategories = categories.filter((c) => c.id !== id);

  return <CategoryForm category={category} parentCategories={parentCategories} />;
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

export default EditCategoryPage;
