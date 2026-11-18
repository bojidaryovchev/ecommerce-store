"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db } from "@ecommerce/database";
import { sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

export type CategoryStats = {
  /** Live products in the category and everything below it. */
  productCount: number;
  /** The lowest active price among them, in cents; null when none has a price. */
  minPrice: number | null;
  /** A photo of the category's priciest product with a photo: the flagship, for menu tiles. */
  sampleImage: string | null;
};

/**
 * Per category, what its subtree holds: for the products menu ("42 продукта · от 3 740 €") and the
 * category tiles. Every product counts toward its own category and all of that category's ancestors.
 */
async function getCategoryStats(): Promise<Record<string, CategoryStats>> {
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.products);

  const rows = await db.execute<{
    id: string;
    product_count: number;
    min_price: number | null;
    sample_image: string | null;
  }>(sql`
    with recursive lineage as (
      select id as category_id, id as ancestor_id from category where deleted_at is null
      union all
      select l.category_id, c.parent_id
      from lineage l join category c on c.id = l.ancestor_id
      where c.parent_id is not null
    ),
    priced as (
      select p.id, p.category_id, coalesce(p.media->'photos'->>0, p.images[1]) as photo,
        (select min(pr.unit_amount) from price pr where pr.product_id = p.id and pr.active) as amount
      from product p
      where p.active
    )
    select l.ancestor_id as id,
      count(distinct pp.id)::int as product_count,
      min(pp.amount)::int as min_price,
      (array_agg(pp.photo order by pp.amount desc nulls last) filter (where pp.photo is not null))[1] as sample_image
    from lineage l
    join priced pp on pp.category_id = l.category_id
    group by l.ancestor_id
  `);

  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      { productCount: Number(row.product_count), minPrice: row.min_price, sampleImage: row.sample_image },
    ]),
  );
}

export { getCategoryStats };
