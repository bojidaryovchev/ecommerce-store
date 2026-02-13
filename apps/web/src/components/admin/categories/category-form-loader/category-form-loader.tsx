import { getCategories, getCategoryById } from "@/queries/categories";
import { notFound } from "next/navigation";
import React from "react";
import { CategoryForm } from "./category-form";

interface Props {
  categoryId?: string;
}

const CategoryFormLoader: React.FC<Props> = async ({ categoryId }) => {
  const categories = await getCategories();

  if (categoryId) {
    const category = await getCategoryById(categoryId);

    if (!category) {
      notFound();
    }

    // Filter out current category from parent options
    const parentCategories = categories.filter((c) => c.id !== categoryId);

    return <CategoryForm category={category} parentCategories={parentCategories} />;
  }

  return <CategoryForm parentCategories={categories} />;
};

export { CategoryFormLoader };
