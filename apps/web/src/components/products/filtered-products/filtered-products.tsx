import { Pagination } from "@/components/common/pagination";
import { ProductsGrid } from "@/components/products";
import { getFilteredProducts, type ProductFilters } from "@/queries/products";
import React from "react";

type FilteredProductsProps = {
  filters: ProductFilters;
};

const FilteredProducts: React.FC<FilteredProductsProps> = async ({ filters }) => {
  const { data: products, page, pageCount } = await getFilteredProducts(filters);

  const hasFilters = filters.query || filters.categoryId || filters.minPrice || filters.maxPrice;

  return (
    <>
      <ProductsGrid
        products={products}
        emptyMessage={
          hasFilters ? "No products match your filters. Try adjusting your search or filters." : "No products found."
        }
      />
      <Pagination page={page} pageCount={pageCount} />
    </>
  );
};

export { FilteredProducts };
