"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { getCategorySubtreeIds } from "../categories/get-category-subtree-ids";
import { defaultPrice, defaultPriceJoin } from "./catalog-conditions";

export type Season = "heating" | "cooling";

/** October to March people shop for heat, April to September for cooling. */
const SEASON_CATEGORIES: Record<Season, string[]> = {
  heating: ["termopompi", "peletni-kamini", "kotli", "klimatitsi"],
  cooling: ["klimatitsi", "termopompi", "radiatori-i-konvektori", "podovo-otoplenie"],
};

/**
 * The home page's seasonal picks: two products with a photo and a price from each of the season's
 * categories, varied by a stable shuffle rather than by price, so the shelf is not only flagships.
 */
async function getSeasonalProducts(perCategory = 2) {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);
  cacheLife("days");

  const month = new Date().getMonth() + 1;
  const season: Season = month >= 4 && month <= 9 ? "cooling" : "heating";
  const slugs = SEASON_CATEGORIES[season];

  const roots = await db
    .select({ id: schema.categories.id, slug: schema.categories.slug })
    .from(schema.categories)
    .where(inArray(schema.categories.slug, slugs));

  const picked: string[] = [];
  for (const slug of slugs) {
    const root = roots.find((category) => category.slug === slug);
    if (!root) continue;
    const rows = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .innerJoin(defaultPrice, defaultPriceJoin)
      .where(
        and(
          eq(schema.products.active, true),
          inArray(schema.products.categoryId, await getCategorySubtreeIds(root.id)),
          isNotNull(defaultPrice.unitAmount),
          sql`coalesce(array_length(${schema.products.images}, 1), 0) > 0`,
        ),
      )
      .orderBy(sql`md5(${schema.products.id})`)
      .limit(perCategory);
    picked.push(...rows.map((row) => row.id));
  }

  const products =
    picked.length === 0
      ? []
      : await db.query.products.findMany({
          where: inArray(schema.products.id, picked),
          with: { prices: { where: eq(schema.prices.active, true) }, category: true },
        });
  products.sort((a, b) => picked.indexOf(a.id) - picked.indexOf(b.id));
  return { season, products, categorySlug: slugs[0]! };
}

export { getSeasonalProducts };
