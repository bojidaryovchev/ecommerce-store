"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, count, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

const DEFAULT_PAGE_SIZE = 50;

type GetPendingSyncChangesOptions = {
  page?: number;
  pageSize?: number;
};

/**
 * Review-queue entries waiting for an admin decision (admin use)
 */
async function getPendingSyncChanges(options: GetPendingSyncChangesOptions = {}) {
  cacheTag(CACHE_TAGS.supplierSync);

  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE);
  const where = eq(schema.syncChanges.status, "pending");

  const [{ total }] = await db.select({ total: count() }).from(schema.syncChanges).where(where);

  const changes = await db.query.syncChanges.findMany({
    where,
    orderBy: [asc(schema.syncChanges.type), desc(schema.syncChanges.updatedAt)],
    limit: pageSize,
    offset: (page - 1) * pageSize,
    with: {
      product: { columns: { id: true, name: true, active: true } },
      supplierProduct: { columns: { name: true, permalink: true, currency: true } },
    },
  });

  return { data: changes, total, page, pageCount: Math.ceil(total / pageSize) };
}

export { getPendingSyncChanges, type GetPendingSyncChangesOptions };
