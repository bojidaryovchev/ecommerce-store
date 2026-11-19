import { CatalogView } from "@/components/catalog";
import { CategoryDetail, CategoryFaq } from "@/components/categories";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { parseCatalogFilters, type SearchParamsInput } from "@/lib/catalog-filters";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryBySlug, getCategoryFaq, getCategoryIndex } from "@/queries/categories";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import React from "react";

interface Props {
  /** URL segments, e.g. ["peletni-kamini", "s-vodna-riza"]. */
  path: string[];
  searchParams: Promise<SearchParamsInput>;
}

const CategoryLoader: React.FC<Props> = async ({ path, searchParams }) => {
  const slug = path[path.length - 1] ?? "";
  const [categories, category, search, locale, t] = await Promise.all([
    getCategoryIndex(),
    getCategoryBySlug(slug),
    searchParams,
    getLocale(),
    getTranslations("catalog.filters"),
  ]);

  if (!category) {
    notFound();
  }

  const trail = categoryTrail(categories, category.id);
  const href = categoryHref(trail);
  // Slugs are unique, so a wrong or outdated parent path still finds the category: send it to its real URL.
  if (`/${path.join("/")}` !== href) {
    const query = new URLSearchParams(
      Object.entries(search).flatMap(([key, value]) =>
        (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => [key, v]),
      ),
    ).toString();
    permanentRedirect({ href: query ? `${href}?${query}` : href, locale });
  }

  // The written introduction is Bulgarian: only the Bulgarian page shows it, and only where the category has no text.
  const faq =
    locale === routing.defaultLocale && !category.description?.trim() ? await getCategoryFaq(category.id) : null;
  const shown = faq?.intro ? { ...category, description: faq.intro } : category;

  const subcategories = categories
    .filter((c) => c.parentId === category.id)
    .map((child) => ({ href: categoryHref([...trail, child]), label: child.name }));

  return (
    <CategoryDetail category={shown} trail={trail} subcategories={subcategories}>
      <CatalogView
        filters={parseCatalogFilters(search, { categoryId: category.id })}
        basePath={href}
        links={subcategories}
        linksTitle={t("subcategories")}
      />
      <CategoryFaq categoryId={category.id} categoryName={category.name} />
    </CategoryDetail>
  );
};

export { CategoryLoader };
