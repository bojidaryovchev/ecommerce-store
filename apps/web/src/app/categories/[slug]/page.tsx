import CategoryDetail from "@/components/category-detail.component";
import { getCategories, getCategoryBySlug } from "@/lib/queries/categories";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
        <CategoryDetailLoader slug={slug} />
      </Suspense>
    </main>
  );
};

interface LoaderProps {
  slug: string;
}

const CategoryDetailLoader: React.FC<LoaderProps> = async ({ slug }) => {
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return <CategoryDetail category={category} />;
};

const CategoryDetailSkeleton: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="bg-default-100 h-8 w-48 animate-pulse rounded" />
        <div className="bg-default-100 h-4 w-96 animate-pulse rounded" />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="bg-default-100 aspect-square animate-pulse rounded-lg" />
            <div className="bg-default-100 h-4 w-3/4 animate-pulse rounded" />
            <div className="bg-default-100 h-4 w-1/2 animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryPage;
