import { CategoryLoader } from "@/components/categories";
import { CategoryDetailSkeleton } from "@/components/common";
import { getCategories, getCategoryBySlug } from "@/queries/categories";
import type { Metadata } from "next";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | Ecommerce Store",
    };
  }

  return {
    title: `${category.name} | Ecommerce Store`,
    description: category.description ?? `Browse products in ${category.name}`,
  };
}

export async function generateStaticParams() {
  const categories = await getCategories();

  return categories.map((category) => ({
    slug: category.slug,
  }));
}

const CategoryPage: React.FC<Props> = async ({ params }) => {
  const { slug } = await params;

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryLoader slug={slug} />
      </Suspense>
    </main>
  );
};

export default CategoryPage;
