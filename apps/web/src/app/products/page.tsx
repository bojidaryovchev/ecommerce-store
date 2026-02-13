import { ProductsGridSkeleton } from "@/components/common";
import { AllProducts, SearchResults } from "@/components/products";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | Ecommerce Store",
  description: "Browse our products",
};

type ProductsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const ProductsPage: React.FC<ProductsPageProps> = async ({ searchParams }) => {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{query ? `Search: "${query}"` : "Products"}</h1>
        {query && <p className="text-muted-foreground mt-1 text-sm">Showing results for &ldquo;{query}&rdquo;</p>}
      </div>
      <Suspense key={query} fallback={<ProductsGridSkeleton />}>
        {query ? <SearchResults query={query} /> : <AllProducts />}
      </Suspense>
    </main>
  );
};

export default ProductsPage;
