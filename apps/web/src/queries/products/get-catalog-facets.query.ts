"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { CatalogFilters } from "@/lib/catalog-filters";
import { db, schema } from "@ecommerce/database";
import { and, count, countDistinct, desc, eq, isNotNull, max, min, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { baseCatalogConditions, defaultPrice, defaultPriceJoin } from "./catalog-conditions";

export type ValueFacet = {
  kind: "values";
  slug: string;
  name: string;
  unit: string | null;
  options: Array<{ value: string; count: number }>;
};

export type RangeFacet = {
  kind: "range";
  slug: string;
  name: string;
  unit: string | null;
  min: number;
  max: number;
};

export type CatalogFacets = {
  total: number;
  inStock: number;
  /** Cents. */
  price: { min: number; max: number } | null;
  brands: Array<{ value: string; count: number }>;
  attributes: Array<ValueFacet | RangeFacet>;
};

/** Mostly-numeric attributes with many distinct values are filtered by range; others by checkboxes. */
const RANGE_MIN_DISTINCT = 7;
const RANGE_MIN_NUMERIC_SHARE = 0.75;

/**
 * What can be filtered on within a category/search, with product counts. Counts reflect the
 * category and search only (not the other selected filters), so options never disappear while clicking.
 */
async function getCatalogFacets(filters: Pick<CatalogFilters, "query" | "categoryId">): Promise<CatalogFacets> {
  cacheTag(CACHE_TAGS.products);
  if (filters.categoryId) cacheTag(CACHE_TAGS.productsByCategory(filters.categoryId));

  const where = and(...(await baseCatalogConditions(filters)));

  const [[summary], brands, values] = await Promise.all([
    db
      .select({
        total: count(),
        inStock: sql<number>`count(*) FILTER (WHERE NOT (${schema.products.trackInventory} AND COALESCE(${schema.products.stockQuantity}, 0) <= 0))`,
        minPrice: min(defaultPrice.unitAmount),
        maxPrice: max(defaultPrice.unitAmount),
      })
      .from(schema.products)
      .leftJoin(defaultPrice, defaultPriceJoin)
      .where(where),
    db
      .select({ value: schema.products.brand, count: count() })
      .from(schema.products)
      .where(and(where, isNotNull(schema.products.brand)))
      .groupBy(schema.products.brand)
      .orderBy(desc(count()), schema.products.brand),
    db
      .select({
        slug: schema.attributes.slug,
        name: schema.attributes.name,
        unit: schema.attributes.unit,
        sortOrder: schema.attributes.sortOrder,
        value: schema.productAttributeValues.value,
        numericValue: schema.productAttributeValues.numericValue,
        count: countDistinct(schema.products.id),
      })
      .from(schema.productAttributeValues)
      .innerJoin(schema.attributes, eq(schema.attributes.id, schema.productAttributeValues.attributeId))
      .innerJoin(schema.products, eq(schema.products.id, schema.productAttributeValues.productId))
      .where(and(where, eq(schema.attributes.filterable, true)))
      .groupBy(
        schema.attributes.slug,
        schema.attributes.name,
        schema.attributes.unit,
        schema.attributes.sortOrder,
        schema.productAttributeValues.value,
        schema.productAttributeValues.numericValue,
      ),
  ]);

  const grouped = new Map<string, typeof values>();
  for (const row of values) {
    const rows = grouped.get(row.slug) ?? [];
    rows.push(row);
    grouped.set(row.slug, rows);
  }

  const attributes = [...grouped.values()]
    .map((rows): ValueFacet | RangeFacet | null => {
      const { slug, name, unit } = rows[0]!;
      const numeric = rows.filter((row) => row.numericValue !== null).map((row) => row.numericValue as number);
      const distinctNumbers = new Set(numeric);
      if (distinctNumbers.size >= RANGE_MIN_DISTINCT && numeric.length / rows.length >= RANGE_MIN_NUMERIC_SHARE) {
        return { kind: "range", slug, name, unit, min: Math.min(...numeric), max: Math.max(...numeric) };
      }
      const options = rows
        .map((row) => ({ value: row.value, count: Number(row.count), numeric: row.numericValue }))
        .sort((a, b) =>
          a.numeric !== null && b.numeric !== null ? a.numeric - b.numeric : a.value.localeCompare(b.value, "bg"),
        )
        .map(({ value, count: n }) => ({ value, count: n }));
      // A filter with a single option doesn't narrow anything.
      return options.length > 1 ? { kind: "values", slug, name, unit, options } : null;
    })
    .filter((facet): facet is ValueFacet | RangeFacet => facet !== null)
    .sort(
      (a, b) =>
        (grouped.get(a.slug)![0]!.sortOrder ?? 0) - (grouped.get(b.slug)![0]!.sortOrder ?? 0) ||
        grouped.get(b.slug)!.length - grouped.get(a.slug)!.length,
    );

  return {
    total: Number(summary?.total ?? 0),
    inStock: Number(summary?.inStock ?? 0),
    price:
      summary?.minPrice !== null && summary?.minPrice !== undefined && summary.maxPrice !== null
        ? { min: summary.minPrice, max: summary.maxPrice }
        : null,
    brands: brands
      .filter((b): b is { value: string; count: number } => b.value !== null)
      .map((b) => ({ ...b, count: Number(b.count) })),
    attributes,
  };
}

export { getCatalogFacets };
