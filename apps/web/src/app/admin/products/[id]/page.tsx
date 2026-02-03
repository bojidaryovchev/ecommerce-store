import ProductForm from "@/components/admin/product-form.component";
import { getCategories } from "@/lib/queries/categories";
import { getProductById } from "@/lib/queries/products";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ id: string }>;
}

const EditProductPage: React.FC<Props> = async ({ params }) => {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Edit Product</h1>
      <Suspense fallback={<FormSkeleton />}>
        <ProductFormLoader id={id} />
      </Suspense>
    </div>
  );
};

interface LoaderProps {
  id: string;
}

const ProductFormLoader: React.FC<LoaderProps> = async ({ id }) => {
  const [product, categories] = await Promise.all([getProductById(id), getCategories()]);

  if (!product) {
    notFound();
  }

  return <ProductForm product={product} categories={categories} />;
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

export default EditProductPage;
