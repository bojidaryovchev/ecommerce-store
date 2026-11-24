import { ProductsGridSkeleton } from "@/components/common";
import { Pagination } from "@/components/common/pagination";
import { ProductsGrid } from "@/components/products";
import { auth } from "@/lib/auth";
import type { CatalogFilters as Filters } from "@/lib/catalog-filters";
import { getCatalogFacets, getCatalogPage, type CatalogFacets } from "@/queries/products";
import { getWishlistProductIds } from "@/queries/wishlist";
import { getTranslations } from "next-intl/server";
import React, { Suspense } from "react";
import { CatalogFilters, type CatalogLink } from "./catalog-filters";
import { CatalogToolbar } from "./catalog-toolbar";

interface Props {
  filters: Filters;
  /** The page the filters apply to, e.g. "/produkti" or "/peletni-kamini". */
  basePath: string;
  /** Category (or subcategory) links shown at the top of the filters. */
  links?: CatalogLink[];
  linksTitle?: string;
}

const CatalogResults: React.FC<Props & { facets: CatalogFacets }> = async ({ filters, facets, ...rest }) => {
  const [result, session, t] = await Promise.all([getCatalogPage(filters), auth(), getTranslations("catalog")]);
  const wishlistedProductIds = session?.user?.id ? await getWishlistProductIds(session.user.id) : undefined;

  return (
    <div className="space-y-6">
      <CatalogToolbar total={result.total} facets={facets} filters={filters} {...rest} />
      <ProductsGrid
        products={result.data}
        wishlistedProductIds={wishlistedProductIds}
        emptyMessage={t("empty")}
        variant="compact"
      />
      <Pagination page={result.page} pageCount={result.pageCount} />
    </div>
  );
};

/** Product listing with a filter sidebar: the shop page, search results and every category page. */
const CatalogView: React.FC<Props> = async (props) => {
  const { filters } = props;
  const facets = await getCatalogFacets({ query: filters.query, categoryId: filters.categoryId });

  return (
    // minmax(0, 1fr): a single column on phones must not grow to its widest child.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <CatalogFilters facets={facets} {...props} />
      </aside>
      <Suspense key={JSON.stringify(filters)} fallback={<ProductsGridSkeleton />}>
        <CatalogResults facets={facets} {...props} />
      </Suspense>
    </div>
  );
};

export { CatalogView };
