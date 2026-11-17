import { CatalogView } from "@/components/catalog";
import { CategoryDetail } from "@/components/categories";
import { parseCatalogFilters, type SearchParamsInput } from "@/lib/catalog-filters";
import { getCategoryBySlug } from "@/queries/categories";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  slug: string;
  searchParams: Promise<SearchParamsInput>;
}

const CategoryLoader: React.FC<Props> = async ({ slug, searchParams }) => {
  const [category, search, t] = await Promise.all([
    getCategoryBySlug(slug),
    searchParams,
    getTranslations("catalog.filters"),
  ]);

  if (!category) {
    notFound();
  }

  const subcategories = category.children.map((child) => ({ href: `/categories/${child.slug}`, label: child.name }));

  return (
    <CategoryDetail category={category}>
      <CatalogView
        filters={parseCatalogFilters(search, { categoryId: category.id })}
        basePath={`/categories/${category.slug}`}
        links={subcategories}
        linksTitle={t("subcategories")}
      />
    </CategoryDetail>
  );
};

export { CategoryLoader };
