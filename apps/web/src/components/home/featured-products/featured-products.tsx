import { ProductsGrid } from "@/components/products";
import { getFeaturedProducts } from "@/queries/products";
import React from "react";

interface Props {
  count?: number;
}

const FeaturedProducts: React.FC<Props> = async ({ count = 8 }) => {
  const products = await getFeaturedProducts(count);
  return <ProductsGrid products={products} />;
};

export { FeaturedProducts };
