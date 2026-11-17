import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { searchProducts } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import { getTranslations } from "next-intl/server";
import React from "react";

type SearchResultsProps = {
  query: string;
};

const SearchResults: React.FC<SearchResultsProps> = async ({ query }) => {
  const [products, session] = await Promise.all([searchProducts(query), auth()]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;
  const t = await getTranslations("products.searchResults");

  return (
    <ProductsGrid
      products={products}
      wishlistedProductIds={wishlistedProductIds}
      emptyMessage={t("empty", { query })}
    />
  );
};

export { SearchResults };
