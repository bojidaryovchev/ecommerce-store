import { AllCategories } from "@/components/categories";
import { CategoriesGridSkeleton } from "@/components/common";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type CategoriesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "categories" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  };
}

const CategoriesPage: React.FC<CategoriesPageProps> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("categories");

  const query = await searchParams;
  const page = Math.max(1, query.page ? Number(query.page) : 1);

  return (
    <main className="max-w-container py-8">
      <h1 className="mb-8 text-3xl font-bold">{t("page.title")}</h1>
      <Suspense key={page} fallback={<CategoriesGridSkeleton count={8} />}>
        <AllCategories page={page} />
      </Suspense>
    </main>
  );
};

export default CategoriesPage;
