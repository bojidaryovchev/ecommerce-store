import type { CatalogFilters } from "@/lib/catalog-filters";
import { schema } from "@ecommerce/database";
import { and, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getCategorySubtreeIds } from "../categories/get-category-subtree-ids";
import { productSearchCondition } from "./product-search";

/** The price a product is sold at: its active default price. Join with `defaultPriceJoin`. */
export const defaultPrice = alias(schema.prices, "default_price");
export const defaultPriceJoin = and(eq(defaultPrice.id, schema.products.defaultPriceId), eq(defaultPrice.active, true));

const productHasAttribute = (slug: string, condition: SQL) => sql`EXISTS (
  SELECT 1 FROM ${schema.productAttributeValues} v
  JOIN ${schema.attributes} a ON a.id = v.attribute_id
  WHERE v.product_id = ${schema.products.id} AND a.slug = ${slug} AND ${condition}
)`;

/** What every catalog view starts from: active products in the category subtree matching the search. */
export async function baseCatalogConditions(filters: Pick<CatalogFilters, "query" | "categoryId">): Promise<SQL[]> {
  const conditions: SQL[] = [eq(schema.products.active, true)];
  if (filters.categoryId) {
    conditions.push(inArray(schema.products.categoryId, await getCategorySubtreeIds(filters.categoryId)));
  }
  const search = filters.query ? productSearchCondition(filters.query) : undefined;
  if (search) conditions.push(search);
  return conditions;
}

/** The narrowing filters from the sidebar. Requires the default price join for price filters. */
export function refinementConditions(filters: CatalogFilters): SQL[] {
  const conditions: SQL[] = [];
  if (filters.brands.length > 0) {
    conditions.push(inArray(schema.products.brand, filters.brands));
  }
  for (const [slug, values] of Object.entries(filters.values)) {
    conditions.push(
      productHasAttribute(
        slug,
        sql`v.value IN (${sql.join(
          values.map((value) => sql`${value}`),
          sql`, `,
        )})`,
      ),
    );
  }
  for (const [slug, range] of Object.entries(filters.ranges)) {
    const bounds: SQL[] = [sql`v.numeric_value IS NOT NULL`];
    if (range.min !== undefined) bounds.push(sql`v.numeric_value >= ${range.min}`);
    if (range.max !== undefined) bounds.push(sql`v.numeric_value <= ${range.max}`);
    conditions.push(productHasAttribute(slug, sql.join(bounds, sql` AND `)));
  }
  if (filters.minPrice !== undefined) conditions.push(gte(defaultPrice.unitAmount, filters.minPrice));
  if (filters.maxPrice !== undefined) conditions.push(lte(defaultPrice.unitAmount, filters.maxPrice));
  if (filters.inStock) {
    conditions.push(
      sql`NOT (${schema.products.trackInventory} AND COALESCE(${schema.products.stockQuantity}, 0) <= 0)`,
    );
  }
  return conditions;
}
