import { CategoryLoader } from "@/components/categories";
import { CategoryDetailSkeleton } from "@/components/common";
import { routing } from "@/i18n/routing";
import type { SearchParamsInput } from "@/lib/catalog-filters";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<SearchParamsInput>;
}

/** Category pages live at /{category}/{subcategory} (e.g. /peletni-kamini/s-vodna-riza). */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, path }, search, categories] = await Promise.all([params, searchParams, getCategoryIndex()]);
  const t = await getTranslations({ locale, namespace: "categories" });
  const category = categories.find((c) => c.slug === path[path.length - 1]);

  if (!category) {
    return { title: t("metadata.notFoundTitle") };
  }

  const href = categoryHref(categoryTrail(categories, category.id));
  // Filtered, sorted or paged views are crawlable but not indexed; the category itself is canonical.
  const narrowed =
    Object.keys(search).some((key) => key !== "page") || (search.page !== undefined && search.page !== "1");
  const indexable = locale === routing.defaultLocale && !narrowed;

  return {
    title: category.name,
    description: t("metadata.categoryDescription", { name: category.name }),
    alternates: { canonical: href },
    ...(!indexable && { robots: { index: false, follow: true } }),
  };
}

export async function generateStaticParams() {
  const categories = await getCategoryIndex();
  return categories.map((category) => ({
    path: categoryTrail(categories, category.id).map((c) => c.slug),
  }));
}

const CategoryPage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale, path } = await params;
  setRequestLocale(locale);

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryLoader path={path} searchParams={searchParams} />
      </Suspense>
    </main>
  );
};

export default CategoryPage;
