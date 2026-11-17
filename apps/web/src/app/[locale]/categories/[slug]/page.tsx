import { CategoryLoader } from "@/components/categories";
import { CategoryDetailSkeleton } from "@/components/common";
import { getCategories, getCategoryBySlug } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const [category, t] = await Promise.all([
    getCategoryBySlug(slug),
    getTranslations({ locale, namespace: "categories" }),
  ]);

  if (!category) {
    return {
      title: t("metadata.notFoundTitle"),
    };
  }

  return {
    title: category.name,
    description: category.description ?? t("metadata.categoryDescription", { name: category.name }),
  };
}

/**
 * Next calls this once for each locale returned by the [locale] layout's generateStaticParams,
 * so every category is prerendered in both languages.
 */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const { data: categories } = await getCategories({ pageSize: 500 });

  return categories.map((category) => ({
    locale: params.locale,
    slug: category.slug,
  }));
}

const CategoryPage: React.FC<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryLoader slug={slug} />
      </Suspense>
    </main>
  );
};

export default CategoryPage;
