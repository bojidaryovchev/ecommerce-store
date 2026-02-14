import { ProductsGridSkeleton } from "@/components/common";
import { FilteredProducts, ProductFilters } from "@/components/products";
import { getRootCategories } from "@/queries/categories";
import type { SortOption } from "@/queries/products";
import type { Metadata } from "next";
import React, { Suspense } from "react";

export const metadata: Metadata = {
  title: "Products | Ecommerce Store",
  description: "Browse our products",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
  }>;
};

const VALID_SORTS = new Set<SortOption>(["newest", "oldest", "price-asc", "price-desc", "name-asc", "name-desc"]);

const ProductsPage: React.FC<ProductsPageProps> = async ({ searchParams }) => {
  const params = await searchParams;
  const [categories] = await Promise.all([getRootCategories()]);

  const query = params.q?.trim() ?? "";
  const categoryId = params.category ?? "";
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const sort = VALID_SORTS.has(params.sort as SortOption) ? (params.sort as SortOption) : undefined;

  const filters = {
    ...(query && { query }),
    ...(categoryId && { categoryId }),
    ...(minPrice !== undefined && !Number.isNaN(minPrice) && { minPrice }),
    ...(maxPrice !== undefined && !Number.isNaN(maxPrice) && { maxPrice }),
    ...(sort && { sort }),
  };

  // Stable key for Suspense — re-stream when any filter changes
  const suspenseKey = JSON.stringify(filters);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{query ? `Search: "${query}"` : "Products"}</h1>
        {query && <p className="text-muted-foreground mt-1 text-sm">Showing results for &ldquo;{query}&rdquo;</p>}
      </div>
      <ProductFilters categories={categories} />
      <Suspense key={suspenseKey} fallback={<ProductsGridSkeleton />}>
        <FilteredProducts filters={filters} />
      </Suspense>
    </main>
  );
};

export default ProductsPage;
