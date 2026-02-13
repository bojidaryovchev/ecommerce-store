import { ProductsGrid } from "@/components/products";
import { searchProducts } from "@/queries/products";
import React from "react";

type SearchResultsProps = {
  query: string;
};

const SearchResults: React.FC<SearchResultsProps> = async ({ query }) => {
  const products = await searchProducts(query);

  return (
    <ProductsGrid products={products} emptyMessage={`No products found for "${query}". Try a different search term.`} />
  );
};

export { SearchResults };
