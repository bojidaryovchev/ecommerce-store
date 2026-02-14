import { AllCategories } from "@/components/categories";
import { CategoriesGridSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Ecommerce Store",
  description: "Browse our product categories",
};

type CategoriesPageProps = {
  searchParams: Promise<{ page?: string }>;
};

const CategoriesPage: React.FC<CategoriesPageProps> = async ({ searchParams }) => {
  const params = await searchParams;
  const page = Math.max(1, params.page ? Number(params.page) : 1);

  return (
    <main className="max-w-container py-8">
      <h1 className="mb-8 text-3xl font-bold">Categories</h1>
      <Suspense key={page} fallback={<CategoriesGridSkeleton count={8} />}>
        <AllCategories page={page} />
      </Suspense>
    </main>
  );
};

export default CategoriesPage;
