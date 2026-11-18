import { CatalogView } from "@/components/catalog";
import { routing } from "@/i18n/routing";
import { parseCatalogFilters, type SearchParamsInput } from "@/lib/catalog-filters";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({ params, searchParams }: ProductsPageProps): Promise<Metadata> {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const t = await getTranslations({ locale, namespace: "products.metadata" });
  // Like category pages: each page of the full listing is its own canonical page; a search or a filter
  // is crawlable but not indexed. Product content is Bulgarian, so the English listing is not indexed.
  const page = typeof search.page === "string" && /^\d+$/.test(search.page) ? Number(search.page) : 1;
  const narrowed = Object.keys(search).some((key) => key !== "page");

  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: !narrowed && page > 1 ? `/products?page=${page}` : "/products" },
    ...((narrowed || locale !== routing.defaultLocale) && { robots: { index: false, follow: true } }),
  };
}

const ProductsPage: React.FC<ProductsPageProps> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const [search, categories, t] = await Promise.all([
    searchParams,
    getCategoryIndex(),
    getTranslations("products.page"),
  ]);
  const filters = parseCatalogFilters(search);
  const query = filters.query;

  return (
    <main className="max-w-container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{query ? t("searchTitle", { query }) : t("title")}</h1>
        {query && <p className="text-muted-foreground mt-1 text-sm">{t("searchResultsFor", { query })}</p>}
      </div>
      <CatalogView
        filters={filters}
        basePath="/products"
        links={categories
          .filter((category) => category.parentId === null)
          .map((category) => ({ href: categoryHref(categoryTrail(categories, category.id)), label: category.name }))}
      />
    </main>
  );
};

export default ProductsPage;
