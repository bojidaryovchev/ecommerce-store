"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all refunds for a specific order
 */
async function getRefundsByOrderId(orderId: string) {
  cacheTag(CACHE_TAGS.refundsByOrder(orderId), CACHE_TAGS.order(orderId));

  const refunds = await db.query.refunds.findMany({
    where: eq(schema.refunds.orderId, orderId),
    orderBy: [desc(schema.refunds.created)],
  });

  return refunds;
}

export { getRefundsByOrderId };
