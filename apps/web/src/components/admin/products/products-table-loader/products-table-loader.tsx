import { Pagination } from "@/components/common/pagination";
import { getAllProducts } from "@/queries/products";
import React from "react";
import { ProductsTable } from "./products-table";

type Props = {
  page?: number;
};

const ProductsTableLoader: React.FC<Props> = async ({ page = 1 }) => {
  const { data: products, pageCount } = await getAllProducts({ page });

  return (
    <>
      <ProductsTable products={products} />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { ProductsTableLoader };
