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
import { categoryHref } from "@/lib/routes";
import type { Category } from "@ecommerce/database/schema";
import { useTranslations } from "next-intl";
import React from "react";

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

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && <p className="text-muted-foreground text-lg">{category.description}</p>}
      </div>

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
