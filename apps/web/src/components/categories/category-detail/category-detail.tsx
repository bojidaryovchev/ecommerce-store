import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import type { CategoryNode } from "@/lib/category-tree";
import { INSTALLATION_FOR_CATEGORY, installationHref } from "@/lib/installation-systems";
import { categoryHref } from "@/lib/routes";
import type { Category } from "@ecommerce/database/schema";
import { ArrowRight, Wrench } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import React from "react";

/** The pictures curated for the catalog's sections (see supplier-sync curation); product photos do not make a banner. */
const isScene = (image: string | null | undefined): image is string =>
  Boolean(image?.startsWith("/images/categories/"));

interface Props {
  category: Category;
  /** The category's ancestors and itself, root first. */
  trail: CategoryNode[];
  subcategories: Array<{ href: string; label: string }>;
  /** The product listing (filters and grid). */
  children: React.ReactNode;
}

const CategoryDetail: React.FC<Props> = ({ category, trail, subcategories, children }) => {
  const t = useTranslations("categories.categoryDetail");
  const ancestors = trail.slice(0, -1);
  // A section's own picture, or its top-level section's for the levels below.
  const banner = [category.image, ...[...trail].reverse().map((node) => node.image)].find(isScene);
  const system = INSTALLATION_FOR_CATEGORY[trail[0]?.slug ?? ""];

  return (
    <div className="space-y-8">
      <Breadcrumb aria-label={t("breadcrumb")}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {ancestors.map((ancestor, index) => (
            <React.Fragment key={ancestor.id}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={categoryHref(ancestors.slice(0, index + 1))}>{ancestor.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </React.Fragment>
          ))}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{category.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {banner ? (
        <header className="bg-muted/50 grid overflow-hidden rounded-3xl md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="flex flex-col justify-center p-5 md:p-10">
            <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">{category.name}</h1>
            {category.description && (
              <p className="text-muted-foreground mt-3 line-clamp-4 leading-relaxed md:line-clamp-none md:text-lg">
                {category.description}
              </p>
            )}
            {system && (
              <Link
                href={installationHref(system)}
                className="text-primary mt-5 inline-flex items-center gap-2 self-start text-sm font-semibold hover:underline"
              >
                <Wrench className="text-heat size-4" aria-hidden />
                {t("installation")}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          <div className="relative order-first aspect-[21/9] md:order-none md:aspect-auto md:min-h-64">
            <Image src={banner} alt="" fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
          </div>
        </header>
      ) : (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {category.description && <p className="text-muted-foreground text-lg">{category.description}</p>}
          {system && (
            <Link
              href={installationHref(system)}
              className="text-primary inline-flex items-center gap-2 text-sm font-semibold hover:underline"
            >
              <Wrench className="text-heat size-4" aria-hidden />
              {t("installation")}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      )}

      {subcategories.length > 0 && (
        <nav aria-label={t("subcategories")} className="flex flex-wrap gap-2 lg:hidden">
          {subcategories.map((subcategory) => (
            <Link
              key={subcategory.href}
              href={subcategory.href}
              className="border-border hover:bg-accent rounded-full border px-3 py-1 text-sm"
            >
              {subcategory.label}
            </Link>
          ))}
        </nav>
      )}

      {children}
    </div>
  );
};

export { CategoryDetail };
