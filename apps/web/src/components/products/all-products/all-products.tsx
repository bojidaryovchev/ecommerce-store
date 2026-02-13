import { ProductsGrid } from "@/components/products";
import { getProducts } from "@/queries/products";
import React from "react";

const AllProducts: React.FC = async () => {
  const products = await getProducts();
  return <ProductsGrid products={products} />;
};

export { AllProducts };
