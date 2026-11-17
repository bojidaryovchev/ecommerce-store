import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import type { CategoryWithChildrenAndParent } from "@/types/category.type";
import { useTranslations } from "next-intl";
import React from "react";

interface Props {
  category: CategoryWithChildrenAndParent;
  /** The product listing (filters and grid). */
  children: React.ReactNode;
}

const CategoryDetail: React.FC<Props> = ({ category, children }) => {
  const t = useTranslations("categories.categoryDetail");

  return (
    <div className="space-y-8">
      <Breadcrumb aria-label={t("breadcrumb")}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{t("home")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/categories">{t("categories")}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {category.parent && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/categories/${category.parent.slug}`}>{category.parent.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
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

      {category.children.length > 0 && (
        <nav aria-label={t("subcategories")} className="flex flex-wrap gap-2 lg:hidden">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className="border-border hover:bg-accent rounded-full border px-3 py-1 text-sm"
            >
              {child.name}
            </Link>
          ))}
        </nav>
      )}

      {children}
    </div>
  );
};

export { CategoryDetail };
