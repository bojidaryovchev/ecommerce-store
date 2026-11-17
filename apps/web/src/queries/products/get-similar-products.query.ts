"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { defaultPrice, defaultPriceJoin } from "./catalog-conditions";

/**
 * Other products from the same category, closest in price first
 */
async function getSimilarProducts(
  product: { id: string; categoryId: string | null; priceAmount: number | null },
  limit = 4,
) {
  cacheTag(CACHE_TAGS.products);
  if (!product.categoryId) return [];
  cacheTag(CACHE_TAGS.productsByCategory(product.categoryId));

  const rows = await db
    .select({ id: schema.products.id })
    .from(schema.products)
    .leftJoin(defaultPrice, defaultPriceJoin)
    .where(
      and(
        eq(schema.products.active, true),
        eq(schema.products.categoryId, product.categoryId),
        ne(schema.products.id, product.id),
      ),
    )
    .orderBy(
      product.priceAmount !== null
        ? sql`abs(coalesce(${defaultPrice.unitAmount}, 0) - ${product.priceAmount}) ASC`
        : desc(schema.products.createdAt),
      asc(schema.products.name),
    )
    .limit(limit);

  const ids = rows.map((row) => row.id);
  if (ids.length === 0) return [];
  const products = await db.query.products.findMany({
    where: inArray(schema.products.id, ids),
    with: { prices: { where: eq(schema.prices.active, true) } },
  });
  const position = new Map(ids.map((id, index) => [id, index]));
  return products
    .sort((a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0))
    .map((p) => ({ ...p, description: p.description ? `${p.description.slice(0, 200)}…` : null }));
}

export { getSimilarProducts };
