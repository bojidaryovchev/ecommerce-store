import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildCategoryMenu } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { getCategoryIndex, getCategoryStats } from "@/queries/categories";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import React from "react";

type CategoriesPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: CategoriesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "categories" });

  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
    alternates: { canonical: "/kategorii" },
    // The categories are Bulgarian content; the English page only translates the interface.
    ...(locale !== routing.defaultLocale && { robots: { index: false, follow: true } }),
  };
}

/** The whole catalogue on one page: every section with its picture and size, and its subsections. */
const CategoriesPage: React.FC<CategoriesPageProps> = async ({ params }) => {
  const { locale } = await params;
  setRequestLocale(locale);
  const [index, stats, t, tNav] = await Promise.all([
    getCategoryIndex(),
    getCategoryStats(),
    getTranslations("categories.page"),
    getTranslations("navigation.navbar"),
  ]);
  const sections = buildCategoryMenu(index, categoryHref, stats);

  return (
    <main className="max-w-container py-10 md:py-14">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-balance md:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{t("lead")}</p>
      </header>

      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <li key={section.id} className="bg-card group flex flex-col overflow-hidden rounded-2xl border">
            <Link href={section.href} className="block">
              <span className="bg-muted relative block aspect-[4/3] overflow-hidden">
                {section.image && (
                  <Image
                    src={section.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className={
                      section.imageKind === "product"
                        ? "bg-white object-contain p-6"
                        : "object-cover transition-transform duration-500 group-hover:scale-105"
                    }
                  />
                )}
              </span>
              <span className="block px-5 pt-4">
                <span className="group-hover:text-primary block text-lg font-semibold transition-colors">
                  {section.name}
                </span>
                <span className="text-muted-foreground mt-0.5 block text-sm">
                  {tNav("productCount", { count: section.productCount })}
                </span>
              </span>
            </Link>
            {section.children.length > 0 && (
              <ul className="flex flex-wrap gap-1.5 px-5 pt-3 pb-5">
                {section.children.map((child) => (
                  <li key={child.id}>
                    <Link
                      href={child.href}
                      className="hover:border-primary/40 hover:text-primary inline-block rounded-full border px-2.5 py-1 text-xs transition-colors"
                    >
                      {child.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {section.children.length === 0 && <span className="pb-5" />}
          </li>
        ))}
      </ul>
    </main>
  );
};

export default CategoriesPage;
