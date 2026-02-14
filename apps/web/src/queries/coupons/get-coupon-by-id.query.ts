"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

async function getCouponById(id: string) {
  cacheTag(CACHE_TAGS.coupons, CACHE_TAGS.coupon(id));

  const coupon = await db.query.coupons.findFirst({
    where: eq(schema.coupons.id, id),
  });

  return coupon ?? null;
}

export { getCouponById };
