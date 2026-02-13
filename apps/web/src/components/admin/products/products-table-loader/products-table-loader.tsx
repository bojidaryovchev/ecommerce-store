import { getAllProducts } from "@/queries/products";
import React from "react";
import { ProductsTable } from "./products-table";

const ProductsTableLoader: React.FC = async () => {
  const products = await getAllProducts();
  return <ProductsTable products={products} />;
};

export { ProductsTableLoader };
