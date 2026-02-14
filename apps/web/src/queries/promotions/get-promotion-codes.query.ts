"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { count, desc } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 20;

type GetPromotionCodesOptions = {
  page?: number;
  pageSize?: number;
};

async function getPromotionCodes(options: GetPromotionCodesOptions = {}) {
  cacheTag(CACHE_TAGS.promotionCodes);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);

  const [{ total }] = await db.select({ total: count() }).from(schema.promotionCodes);

  const pageCount = Math.ceil(total / pageSize);

  const promotionCodes = await db.query.promotionCodes.findMany({
    orderBy: [desc(schema.promotionCodes.createdAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      coupon: {
        columns: {
          id: true,
          name: true,
          percentOff: true,
          amountOff: true,
          currency: true,
          duration: true,
        },
      },
    },
  });

  return { data: promotionCodes, pageCount, total };
}

export { getPromotionCodes, type GetPromotionCodesOptions };
