import { AllCategories } from "@/components/categories";
import { CategoriesGridSkeleton } from "@/components/common";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Categories | Ecommerce Store",
  description: "Browse our product categories",
};

const CategoriesPage: React.FC = () => {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Categories</h1>
      <Suspense fallback={<CategoriesGridSkeleton count={8} />}>
        <AllCategories />
      </Suspense>
    </main>
  );
};

export default CategoriesPage;
