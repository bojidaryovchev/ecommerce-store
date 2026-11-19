"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * The questions a category page shows: those the second reader passed (packages/supplier-sync/src/enrich/faq.ts)
 * or the admin wrote. A draft waiting for the admin is not among them. Empty when there are none. With them, for a
 * category without its own description, the introduction and meta description written the same way.
 */
async function getCategoryFaq(categoryId: string) {
  cacheTag(CACHE_TAGS.categories, CACHE_TAGS.categoryFaq(categoryId));

  const row = await db.query.categoryFaqs.findFirst({
    where: eq(schema.categoryFaqs.categoryId, categoryId),
    columns: { items: true, intro: true, metaDescription: true },
  });
  return { items: row?.items ?? [], intro: row?.intro ?? null, metaDescription: row?.metaDescription ?? null };
}

export { getCategoryFaq };
