import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { searchProducts } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import React from "react";

type SearchResultsProps = {
  query: string;
};

const SearchResults: React.FC<SearchResultsProps> = async ({ query }) => {
  const [products, session] = await Promise.all([searchProducts(query), auth()]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;

  return (
    <ProductsGrid
      products={products}
      wishlistedProductIds={wishlistedProductIds}
      emptyMessage={`No products found for "${query}". Try a different search term.`}
    />
  );
};

export { SearchResults };
