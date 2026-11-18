"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db } from "@ecommerce/database";
import { sql } from "drizzle-orm";
import { cacheTag } from "next/cache";

/** Every live product's value of each numeric specification within one section of the catalog. */
export type SpecRanges = Record<string, { values: number[]; unit: string | null }>;

/**
 * The numeric specifications (power, heated area…) of every live product under a top-level category,
 * per attribute, sorted: what a product page needs to place its own values among the others'.
 */
async function getSpecRanges(rootCategoryId: string): Promise<SpecRanges> {
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.categories);

  const rows = await db.execute<{ attribute_id: string; unit: string | null; values: number[] }>(sql`
    with recursive subtree as (
      select id from category where id = ${rootCategoryId}
      union all
      select c.id from category c join subtree s on c.parent_id = s.id where c.deleted_at is null
    )
    select v.attribute_id, a.unit,
      array_agg(v.numeric_value::float8 order by v.numeric_value) as values
    from product p
    join subtree s on s.id = p.category_id
    join product_attribute_value v on v.product_id = p.id
    join attribute a on a.id = v.attribute_id
    where p.active and v.numeric_value is not null
    group by v.attribute_id, a.unit
  `);

  return Object.fromEntries(rows.map((row) => [row.attribute_id, { values: row.values.map(Number), unit: row.unit }]));
}

export { getSpecRanges };
