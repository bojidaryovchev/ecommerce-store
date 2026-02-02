"use client";

import CategoriesGrid from "@/components/categories-grid.component";
import ProductsGrid from "@/components/products-grid.component";
import type { CategoryWithProductsAndChildren } from "@/types/category.type";
import { BreadcrumbItem, Breadcrumbs } from "@heroui/react";
import React from "react";

interface Props {
  category: CategoryWithProductsAndChildren;
}

const CategoryDetail: React.FC<Props> = ({ category }) => {
  return (
    <div className="space-y-8">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Home</BreadcrumbItem>
        <BreadcrumbItem href="/categories">Categories</BreadcrumbItem>
        {category.parent && (
          <BreadcrumbItem href={`/categories/${category.parent.slug}`}>{category.parent.name}</BreadcrumbItem>
        )}
        <BreadcrumbItem>{category.name}</BreadcrumbItem>
      </Breadcrumbs>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && <p className="text-default-600 text-lg">{category.description}</p>}
      </div>

      {category.children.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Subcategories</h2>
          <CategoriesGrid categories={category.children} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          Products {category.products.length > 0 && `(${category.products.length})`}
        </h2>
        <ProductsGrid products={category.products} />
      </section>
    </div>
  );
};

export default CategoryDetail;
