"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { CATALOG_PAGE_SIZE, type CatalogFilters } from "@/lib/catalog-filters";
import { db, schema } from "@ecommerce/database";
import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { baseCatalogConditions, defaultPrice, defaultPriceJoin, refinementConditions } from "./catalog-conditions";
import { productSearchRank } from "./product-search";

const CARD_DESCRIPTION_LENGTH = 200;

function orderBy(filters: CatalogFilters): SQL[] {
  const sort = filters.sort ?? (filters.query ? "relevance" : "newest");
  const tiebreak = [asc(schema.products.name), asc(schema.products.id)];
  switch (sort) {
    case "relevance":
      return filters.query ? [desc(productSearchRank(filters.query)), ...tiebreak] : tiebreak;
    case "price-asc":
      return [sql`${defaultPrice.unitAmount} ASC NULLS LAST`, ...tiebreak];
    case "price-desc":
      return [sql`${defaultPrice.unitAmount} DESC NULLS LAST`, ...tiebreak];
    case "name-asc":
      return tiebreak;
    case "name-desc":
      return [desc(schema.products.name), asc(schema.products.id)];
    case "newest":
    default:
      return [desc(schema.products.createdAt), ...tiebreak];
  }
}

/**
 * One page of the catalog for the given filters (storefront product list and category pages).
 * Finds the matching ids in one query (filters, sorting by the price customers pay), then loads
 * those products with their prices and category.
 */
async function getCatalogPage(filters: CatalogFilters, pageSize = CATALOG_PAGE_SIZE) {
  cacheTag(CACHE_TAGS.products);
  if (filters.categoryId) cacheTag(CACHE_TAGS.productsByCategory(filters.categoryId));

  const where = and(...(await baseCatalogConditions(filters)), ...refinementConditions(filters));
  const page = Math.max(1, filters.page);

  const [[{ total }], rows] = await Promise.all([
    db.select({ total: count() }).from(schema.products).leftJoin(defaultPrice, defaultPriceJoin).where(where),
    db
      .select({ id: schema.products.id })
      .from(schema.products)
      .leftJoin(defaultPrice, defaultPriceJoin)
      .where(where)
      .orderBy(...orderBy(filters))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const ids = rows.map((row) => row.id);
  const products =
    ids.length === 0
      ? []
      : await db.query.products.findMany({
          where: inArray(schema.products.id, ids),
          with: {
            prices: { where: eq(schema.prices.active, true) },
            category: true,
          },
        });
  const position = new Map(ids.map((id, index) => [id, index]));
  products.sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0));

  // Cards show two lines of the description; don't ship whole supplier texts with every listing.
  const data = products.map((product) => ({
    ...product,
    description:
      product.description && product.description.length > CARD_DESCRIPTION_LENGTH
        ? `${product.description.slice(0, CARD_DESCRIPTION_LENGTH).trimEnd()}…`
        : product.description,
  }));

  return { data, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export { getCatalogPage };
