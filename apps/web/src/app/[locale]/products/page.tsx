import { ProductsGridSkeleton } from "@/components/common";
import { FilteredProducts, ProductFilters } from "@/components/products";
import { getRootCategories } from "@/queries/categories";
import type { SortOption } from "@/queries/products";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    page?: string;
  }>;
};

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const VALID_SORTS = new Set<SortOption>(["newest", "oldest", "price-asc", "price-desc", "name-asc", "name-desc"]);

const ProductsPage: React.FC<ProductsPageProps> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const search = await searchParams;
  const [{ data: categories }] = await Promise.all([getRootCategories({ pageSize: 100 })]);
  const t = await getTranslations("products.page");

  const query = search.q?.trim() ?? "";
  const categoryId = search.category ?? "";
  const minPrice = search.minPrice ? Number(search.minPrice) : undefined;
  const maxPrice = search.maxPrice ? Number(search.maxPrice) : undefined;
  const sort = VALID_SORTS.has(search.sort as SortOption) ? (search.sort as SortOption) : undefined;
  const page = Math.max(1, search.page ? Number(search.page) : 1);

  const filters = {
    ...(query && { query }),
    ...(categoryId && { categoryId }),
    ...(minPrice !== undefined && !Number.isNaN(minPrice) && { minPrice }),
    ...(maxPrice !== undefined && !Number.isNaN(maxPrice) && { maxPrice }),
    ...(sort && { sort }),
    page,
  };

  // Stable key for Suspense — re-stream when any filter changes
  const suspenseKey = JSON.stringify(filters);

  return (
    <main className="max-w-container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{query ? t("searchTitle", { query }) : t("title")}</h1>
        {query && <p className="text-muted-foreground mt-1 text-sm">{t("searchResultsFor", { query })}</p>}
      </div>
      <ProductFilters categories={categories} />
      <Suspense key={suspenseKey} fallback={<ProductsGridSkeleton />}>
        <FilteredProducts filters={filters} />
      </Suspense>
    </main>
  );
};

export default ProductsPage;
