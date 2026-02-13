import { getCategories } from "@/queries/categories";
import React from "react";
import { CategoriesTable } from "./categories-table";

const CategoriesTableLoader: React.FC = async () => {
  const categories = await getCategories();
  return <CategoriesTable categories={categories} />;
};

export { CategoriesTableLoader };
