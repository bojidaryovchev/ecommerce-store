import { CategoriesGrid } from "@/components/categories";
import { Pagination } from "@/components/common/pagination";
import { getRootCategories } from "@/queries/categories";
import React from "react";

type AllCategoriesProps = {
  page?: number;
};

const AllCategories: React.FC<AllCategoriesProps> = async ({ page = 1 }) => {
  const { data: categories, pageCount } = await getRootCategories({ page });

  return (
    <>
      <CategoriesGrid categories={categories} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { AllCategories };
