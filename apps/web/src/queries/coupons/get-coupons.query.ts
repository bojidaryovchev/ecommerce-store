"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { count, desc } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetCouponsOptions = {
  page?: number;
  pageSize?: number;
};

async function getCoupons(options: GetCouponsOptions = {}) {
  cacheTag(CACHE_TAGS.coupons);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [{ total }] = await db.select({ total: count() }).from(schema.coupons);

  const pageCount = Math.ceil(total / pageSize);

  const coupons = await db.query.coupons.findMany({
    orderBy: [desc(schema.coupons.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  return { data: coupons, pageCount, total };
}

export { getCoupons, type GetCouponsOptions };
