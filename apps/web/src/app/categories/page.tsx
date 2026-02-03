import CategoriesGrid from "@/components/categories-grid.component";
import { getRootCategories } from "@/lib/queries/categories";
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
      <Suspense fallback={<CategoriesGridSkeleton />}>
        <CategoriesGridLoader />
      </Suspense>
    </main>
  );
};

const CategoriesGridLoader: React.FC = async () => {
  const categories = await getRootCategories();
  return <CategoriesGrid categories={categories} />;
};

const CategoriesGridSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-muted aspect-square animate-pulse rounded-lg" />
      ))}
    </div>
  );
};

export default CategoriesPage;
