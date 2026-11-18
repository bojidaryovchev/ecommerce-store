"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { categoryTrail } from "@/lib/category-tree";
import { categoryHref } from "@/lib/routes";
import { db, schema } from "@ecommerce/database";
import { and, count, desc, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getCategoryIndex } from "../categories/get-category-index.query";
import { baseCatalogConditions, defaultPrice, defaultPriceJoin } from "./catalog-conditions";
import { productSearchRank } from "./product-search";

export type SearchSuggestions = {
  /** Echoed back so the field can drop replies to a term the visitor has typed past. */
  term: string;
  products: Array<{
    id: string;
    slug: string | null;
    name: string;
    brand: string | null;
    image: string | null;
    /** In cents; null for products sold on enquiry. */
    price: number | null;
    currency: string;
  }>;
  categories: Array<{ id: string; name: string; href: string; productCount: number }>;
  brands: Array<{ name: string; productCount: number }>;
  /** Every product the results page would show for the term. */
  total: number;
};

const PRODUCT_LIMIT = 6;

/**
 * What the header search offers while you type. It matches with exactly the predicate the results
 * page uses (`baseCatalogConditions`): a dropdown that offers something the results page then
 * cannot find would be worse than no dropdown.
 */
async function getSearchSuggestions(term: string): Promise<SearchSuggestions> {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);
  cacheLife("hours");

  const where = and(...(await baseCatalogConditions({ query: term })));
  const [[{ total } = { total: 0 }], products, byCategory, byBrand, index] = await Promise.all([
    db.select({ total: count() }).from(schema.products).where(where),
    db
      .select({
        id: schema.products.id,
        slug: schema.products.slug,
        name: schema.products.name,
        brand: schema.products.brand,
        image: sql<string | null>`${schema.products.images}[1]`,
        price: defaultPrice.unitAmount,
        currency: defaultPrice.currency,
      })
      .from(schema.products)
      .leftJoin(defaultPrice, defaultPriceJoin)
      .where(where)
      .orderBy(desc(productSearchRank(term)), desc(defaultPrice.unitAmount))
      .limit(PRODUCT_LIMIT),
    db
      .select({ categoryId: schema.products.categoryId, productCount: count() })
      .from(schema.products)
      .where(and(where, isNotNull(schema.products.categoryId)))
      .groupBy(schema.products.categoryId)
      .orderBy(desc(count()))
      .limit(4),
    db
      .select({ name: schema.products.brand, productCount: count() })
      .from(schema.products)
      .where(and(where, isNotNull(schema.products.brand)))
      .groupBy(schema.products.brand)
      .orderBy(desc(count()))
      .limit(3),
    getCategoryIndex(),
  ]);

  return {
    term,
    products: products.map((product) => ({ ...product, currency: product.currency ?? "eur" })),
    categories: byCategory.flatMap(({ categoryId, productCount }) => {
      const trail = categoryTrail(index, categoryId);
      const category = trail.at(-1);
      return category ? [{ id: category.id, name: category.name, href: categoryHref(trail), productCount }] : [];
    }),
    brands: byBrand.flatMap(({ name, productCount }) => (name ? [{ name, productCount }] : [])),
    total,
  };
}

export { getSearchSuggestions };
