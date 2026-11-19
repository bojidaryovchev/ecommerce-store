import { TableSkeleton } from "@/components/common";
import { CompareGrid, type CompareColumn, type CompareRow } from "@/components/products/compare/compare-grid";
import { specRows } from "@/components/products/product-detail/product-specs";
import { priceFormat } from "@/i18n/format";
import { COMPARE_LIMIT } from "@/lib/compare-limit";
import { primaryPhoto } from "@/lib/product-media";
import { productHref } from "@/lib/routes";
import { getProductsBySlugs } from "@/queries/products";
import { kindOfCategory } from "@ecommerce/supplier-sync/enrich";
import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import React, { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string | string[] }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "products.compare" });
  // A view of products chosen by the visitor: useful to them, nothing for an index.
  return { title: t("title"), robots: { index: false, follow: true } };
}

/** The products in the link (?p=slug,slug), at most four, as the table shows them. */
const Comparison: React.FC<{ searchParams: Props["searchParams"] }> = async ({ searchParams }) => {
  const { p } = await searchParams;
  const slugs = [
    ...new Set(
      (Array.isArray(p) ? p.join(",") : (p ?? ""))
        .split(",")
        .map((slug) => slug.trim())
        .filter(Boolean),
    ),
  ].slice(0, COMPARE_LIMIT);
  const [products, t, format] = await Promise.all([
    getProductsBySlugs(slugs),
    getTranslations("products.compare"),
    getFormatter(),
  ]);

  if (products.length < 2) {
    return <p className="text-muted-foreground rounded-2xl border border-dashed p-8 text-center">{t("empty")}</p>;
  }

  const columns: CompareColumn[] = products.map((product) => {
    const price = product.prices.find((entry) => entry.id === product.defaultPriceId) ?? product.prices[0];
    return {
      id: product.id,
      slug: product.slug ?? product.id,
      name: product.name,
      href: productHref(product),
      image: primaryPhoto(product),
      price:
        price && price.unitAmount !== null ? format.number(price.unitAmount / 100, priceFormat(price.currency)) : null,
    };
  });

  // Every characteristic any of them has, in the first product's order, then the others'.
  const perProduct = products.map(
    (product) => new Map(specRows(product.attributeValues).map((row) => [row.name, row])),
  );
  const names: string[] = [];
  for (const rows of perProduct) for (const name of rows.keys()) if (!names.includes(name)) names.push(name);
  const valueRows: CompareRow[] = names.map((name) => {
    const values = perProduct.map((rows) => rows.get(name)?.values.join(", ") ?? null);
    return { name, values, differs: new Set(values.map((value) => value?.toLowerCase() ?? "")).size > 1 };
  });
  const brands = products.map((product) => product.brand);
  const rows: CompareRow[] = [
    { name: t("brand"), values: brands, differs: new Set(brands.map((brand) => brand?.toLowerCase() ?? "")).size > 1 },
    ...valueRows,
  ];
  const kinds = new Set(products.map((product) => kindOfCategory(product.category?.slug) ?? product.category?.id));

  return (
    <div className="space-y-4">
      {kinds.size > 1 && <p className="rounded-lg border p-3 text-sm">{t("mixed")}</p>}
      <CompareGrid columns={columns} rows={rows} />
    </div>
  );
};

const ComparePage: React.FC<Props> = async ({ params, searchParams }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products.compare");

  return (
    <main className="max-w-container py-10 md:py-14">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-3">{t("lead")}</p>
      </div>
      <div className="mt-8">
        <Suspense fallback={<TableSkeleton />}>
          <Comparison searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
};

export default ComparePage;
