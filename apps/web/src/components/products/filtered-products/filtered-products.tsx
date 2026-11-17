import { Pagination } from "@/components/common/pagination";
import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import { getFilteredProducts, type ProductFilters } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import { getTranslations } from "next-intl/server";
import React from "react";

type FilteredProductsProps = {
  filters: ProductFilters;
};

const FilteredProducts: React.FC<FilteredProductsProps> = async ({ filters }) => {
  const [{ data: products, page, pageCount }, session] = await Promise.all([getFilteredProducts(filters), auth()]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;
  const t = await getTranslations("products.filteredProducts");

  const hasFilters = filters.query || filters.categoryId || filters.minPrice || filters.maxPrice;

  return (
    <>
      <ProductsGrid
        products={products}
        wishlistedProductIds={wishlistedProductIds}
        emptyMessage={hasFilters ? t("emptyFiltered") : t("empty")}
      />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { FilteredProducts };
