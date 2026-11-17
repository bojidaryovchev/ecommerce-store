import { CatalogView } from "@/components/catalog";
import { parseCatalogFilters, type SearchParamsInput } from "@/lib/catalog-filters";
import { getRootCategories } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React from "react";

type ProductsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsInput>;
};

export async function generateMetadata({ params }: ProductsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const ProductsPage: React.FC<ProductsPageProps> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);

  const [search, { data: categories }, t] = await Promise.all([
    searchParams,
    getRootCategories({ pageSize: 100 }),
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
        links={categories.map((category) => ({ href: `/categories/${category.slug}`, label: category.name }))}
      />
    </main>
  );
};

export default ProductsPage;
