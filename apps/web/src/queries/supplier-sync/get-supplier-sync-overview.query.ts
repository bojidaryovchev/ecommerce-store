"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { asc, count, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Suppliers with product counts, open review items by type, and the latest sync runs (admin use)
 */
async function getSupplierSyncOverview() {
  cacheTag(CACHE_TAGS.supplierSync);

  const [suppliers, productCounts, pendingByType, runs] = await Promise.all([
    db.query.suppliers.findMany({ orderBy: [asc(schema.suppliers.name)] }),
    db
      .select({
        supplierId: schema.supplierProducts.supplierId,
        total: count(),
        linked: count(schema.supplierProducts.productId),
        removed: count(schema.supplierProducts.removedAt),
      })
      .from(schema.supplierProducts)
      .groupBy(schema.supplierProducts.supplierId),
    db
      .select({ type: schema.syncChanges.type, total: count() })
      .from(schema.syncChanges)
      .where(eq(schema.syncChanges.status, "pending"))
      .groupBy(schema.syncChanges.type),
    db.query.syncRuns.findMany({
      orderBy: [desc(schema.syncRuns.startedAt)],
      limit: 15,
      with: { supplier: { columns: { name: true } } },
    }),
  ]);

  return {
    suppliers: suppliers.map((supplier) => {
      const counts = productCounts.find((row) => row.supplierId === supplier.id);
      return { ...supplier, products: counts?.total ?? 0, linked: counts?.linked ?? 0, removed: counts?.removed ?? 0 };
    }),
    pendingByType: Object.fromEntries(pendingByType.map((row) => [row.type, row.total])) as Partial<
      Record<(typeof pendingByType)[number]["type"], number>
    >,
    runs,
  };
}

export { getSupplierSyncOverview };
