import { ProductDetailSkeleton } from "@/components/common";
import { ProductLoader } from "@/components/products";
import { routing } from "@/i18n/routing";
import { hasOwnCopy } from "@/lib/product-indexing";
import { primaryPhoto } from "@/lib/product-media";
import { productHref } from "@/lib/routes";
import { getProductBySlug, getProducts } from "@/queries/products";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** Product pages prerendered for the secondary locale (English); the rest render on demand on their first visit. */
const PRERENDERED_SECONDARY_LOCALE_PRODUCTS = 20;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProductBySlug(slug);
  const t = await getTranslations({ locale, namespace: "products.metadata" });

  // Crawlers get blocking metadata (htmlLimitedBots in next.config), so this runs before the response
  // starts and an unknown product is a real 404 for them; visitors see the same not-found page.
  if (!product) notFound();

  // The rewritten copy comes with its own meta description (supplier-sync rewrite); else the opening of the text.
  const description =
    product.metadata?.metaDescription ??
    truncate(product.description ?? t("productDescription", { name: product.name }), 160);
  const path = productHref(product);
  const photo = primaryPhoto(product);
  // Product content is Bulgarian; the English pages only translate the interface, so they stay out of the index.
  // So does a page whose text is still the supplier's, until its own copy is published.
  const indexable = locale === routing.defaultLocale && hasOwnCopy(product);

  return {
    title: product.name,
    description,
    ...(locale === routing.defaultLocale && { alternates: { canonical: path } }),
    ...(!indexable && { robots: { index: false, follow: true } }),
    openGraph: { type: "website", title: product.name, description, url: path, images: photo ? [photo] : [] },
  };
}

// Runs once per locale from the [locale] layout. Every Bulgarian product page is prerendered; English only the
// newest few. Each locale must get at least one entry: with Cache Components an empty list fails the build.
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const products = await getProducts();
  const prerendered =
    params.locale === routing.defaultLocale ? products : products.slice(0, PRERENDERED_SECONDARY_LOCALE_PRODUCTS);

  return prerendered.filter((product) => product.slug).map((product) => ({ slug: product.slug! }));
}

const ProductPage: React.FC<Props> = async ({ params }) => {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  // Decided before anything streams, so an unknown product is a real 404, not a 200 "not found" page.
  if (!(await getProductBySlug(slug))) notFound();

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={<ProductDetailSkeleton />}>
        <ProductLoader slug={slug} />
      </Suspense>
    </main>
  );
};

export default ProductPage;
