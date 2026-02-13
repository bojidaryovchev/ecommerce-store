import { CategoriesGrid } from "@/components/categories";
import { getRootCategories } from "@/queries/categories";
import React from "react";

const AllCategories: React.FC = async () => {
  const categories = await getRootCategories();
  return <CategoriesGrid categories={categories} />;
};

export { AllCategories };
