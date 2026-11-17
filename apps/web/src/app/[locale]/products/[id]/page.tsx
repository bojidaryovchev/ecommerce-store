import { ProductDetailSkeleton } from "@/components/common";
import { ProductLoader } from "@/components/products";
import { routing } from "@/i18n/routing";
import { getProductById, getProducts } from "@/queries/products";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; id: string }>;
}

/** Product pages prerendered for the secondary locale (English); the rest render on demand on their first visit. */
const PRERENDERED_SECONDARY_LOCALE_PRODUCTS = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, id } = await params;
  const product = await getProductById(id);
  const t = await getTranslations({ locale, namespace: "products.metadata" });

  if (!product) {
    return {
      title: t("productNotFound"),
    };
  }

  return {
    title: product.name,
    description: product.description ?? t("productDescription", { name: product.name }),
  };
}

// Runs once per locale from the [locale] layout. Every Bulgarian product page is prerendered; English only the
// newest few. Each locale must get at least one entry: with Cache Components an empty list fails the build.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const products = await getProducts();
  const prerendered =
    params.locale === routing.defaultLocale ? products : products.slice(0, PRERENDERED_SECONDARY_LOCALE_PRODUCTS);

  return prerendered.map((product) => ({
    id: product.id,
  }));
}

const ProductPage: React.FC<Props> = async ({ params }) => {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductLoader productId={id} />
      </Suspense>
    </main>
  );
};

export default ProductPage;
