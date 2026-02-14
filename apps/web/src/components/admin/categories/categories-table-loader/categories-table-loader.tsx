import { Pagination } from "@/components/common/pagination";
import { getCategories } from "@/queries/categories";
import React from "react";
import { CategoriesTable } from "./categories-table";

type Props = {
  page?: number;
};

const CategoriesTableLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: categories, pageCount } = await getCategories({ page });

  return (
    <>
      <CategoriesTable categories={categories} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { CategoriesTableLoader };
