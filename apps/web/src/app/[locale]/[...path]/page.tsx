import { CategoryLoader } from "@/components/categories";
import { CategoryDetailSkeleton } from "@/components/common";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { SearchParamsInput } from "@/lib/catalog-filters";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryBySlug, getCategoryFaq, getCategoryIndex, getCategoryStats } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import React, { Suspense } from "react";

interface Props {
  params: Promise<{ locale: string; path: string[] }>;
  searchParams: Promise<SearchParamsInput>;
}

/** Category pages live at /{category}/{subcategory} (e.g. /peletni-kamini/s-vodna-riza). */
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ locale, path }, search, categories] = await Promise.all([params, searchParams, getCategoryIndex()]);
  const t = await getTranslations({ locale, namespace: "categories" });
  const slug = path[path.length - 1] ?? "";
  const [category, details] = await Promise.all([
    Promise.resolve(categories.find((c) => c.slug === slug)),
    getCategoryBySlug(slug),
  ]);

  // Crawlers get blocking metadata (htmlLimitedBots in next.config), so this runs before the response
  // starts: an unknown category is a real 404 for them, and an outdated path a real redirect.
  if (!category) notFound();

  const href = categoryHref(categoryTrail(categories, category.id));
  if (`/${path.join("/")}` !== href) permanentRedirect({ href, locale });
  // Each page of the listing is its own canonical page (Google's advice for pagination); filtered or
  // sorted views are crawlable but not indexed, with the category itself as canonical.
  const page = typeof search.page === "string" && /^\d+$/.test(search.page) ? Number(search.page) : 1;
  const filtered = Object.keys(search).some((key) => key !== "page");
  // An empty section (all its products withdrawn) is kept out of the index until it has products again.
  const stats = await getCategoryStats();
  const empty = (stats[category.id]?.productCount ?? 0) === 0;
  const indexable = locale === routing.defaultLocale && !filtered && !empty;
  // A category without its own description: the meta description written with its questions (Bulgarian pages).
  const written =
    !details?.description && locale === routing.defaultLocale
      ? (await getCategoryFaq(category.id)).metaDescription
      : null;

  // The section's picture as the preview: its own, or its top-level section's.
  const picture = [category, ...categoryTrail(categories, category.id).reverse()]
    .map((node) => node.image)
    .find((image) => image?.startsWith("/images/categories/"));

  return {
    title: page > 1 ? t("metadata.pagedTitle", { name: category.name, page }) : category.name,
    ...(picture && { openGraph: { images: [picture] } }),
    description: details?.description || written || t("metadata.categoryDescription", { name: category.name }),
    alternates: { canonical: !filtered && page > 1 ? `${href}?page=${page}` : href },
    ...(!indexable && { robots: { index: false, follow: true } }),
  };
}

export async function generateStaticParams() {
  const categories = await getCategoryIndex();
  return categories.map((category) => ({
    path: categoryTrail(categories, category.id).map((c) => c.slug),
  }));
}

/**
 * The metadata reads the query (a page number or a filter changes the canonical and robots), which
 * Cache Components only allows once the page says it renders per request on purpose: this marker.
 */
const RequestTime: React.FC = async () => {
  await connection();
  return null;
};

const CategoryPage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale, path } = await params;
  setRequestLocale(locale);

  // Decided before anything streams, so a missing category is a real 404 and an outdated path a real
  // redirect (inside the Suspense below they could only be a 200 page and a client-side jump).
  const [categories, category] = await Promise.all([
    getCategoryIndex(),
    getCategoryBySlug(path[path.length - 1] ?? ""),
  ]);
  if (!category) notFound();
  const href = categoryHref(categoryTrail(categories, category.id));
  if (`/${path.join("/")}` !== href) {
    // Slugs are unique, so a wrong or outdated parent path still finds the category: send it to its real URL.
    const search = await searchParams;
    const query = new URLSearchParams(
      Object.entries(search).flatMap(([key, value]) =>
        (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => [key, v]),
      ),
    ).toString();
    permanentRedirect({ href: query ? `${href}?${query}` : href, locale });
  }

  return (
    <main className="max-w-container py-8">
      <Suspense fallback={null}>
        <RequestTime />
      </Suspense>
      <Suspense fallback={<CategoryDetailSkeleton />}>
        <CategoryLoader path={path} searchParams={searchParams} />
      </Suspense>
    </main>
  );
};

export default CategoryPage;
