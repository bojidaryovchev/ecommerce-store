import { CategoriesGrid } from "@/components/categories";
import { getRootCategories } from "@/queries/categories";
import React from "react";

interface Props {
  count?: number;
}

const FeaturedCategories: React.FC<Props> = async ({ count = 4 }) => {
  const categories = await getRootCategories();
  const featuredCategories = categories.slice(0, count);
  return <CategoriesGrid categories={featuredCategories} />;
};

export { FeaturedCategories };
