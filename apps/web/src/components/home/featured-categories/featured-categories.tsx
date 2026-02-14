import { CategoriesGrid } from "@/components/categories";
import { getRootCategories } from "@/queries/categories";
import React from "react";

interface Props {
  count?: number;
}

const FeaturedCategories: React.FC<Props> = async ({ count = 4 }) => {
  const { data: categories } = await getRootCategories({ pageSize: count });
  const featuredCategories = categories.slice(0, count);
  return <CategoriesGrid categories={featuredCategories} />;
};

export { FeaturedCategories };
