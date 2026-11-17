import { ProductsGrid } from "@/components/products";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/i18n/navigation";
import type { CategoryWithProductsAndChildren } from "@/types/category.type";
import { useTranslations } from "next-intl";
import React from "react";
import { CategoriesGrid } from "../categories-grid";

interface Props {
  category: CategoryWithProductsAndChildren;
  wishlistedProductIds?: string[];
}

const CategoryDetail: React.FC<Props> = ({ category, wishlistedProductIds }) => {
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
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t("subcategories")}</h2>
          <CategoriesGrid categories={category.children} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("products", { count: category.products.length })}</h2>
        <ProductsGrid products={category.products} wishlistedProductIds={wishlistedProductIds} />
      </section>
    </div>
  );
};

export { CategoryDetail };
