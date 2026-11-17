"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, count, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * The supplier product a product of ours is synced from, or null (admin product form)
 */
async function getProductSupplierLink(productId: string) {
  cacheTag(CACHE_TAGS.supplierSync, CACHE_TAGS.product(productId));

  const link = await db.query.supplierProducts.findFirst({
    where: eq(schema.supplierProducts.productId, productId),
    columns: {
      externalId: true,
      name: true,
      permalink: true,
      priceAmount: true,
      currency: true,
      inStock: true,
      onBackorder: true,
      lastSeenAt: true,
      removedAt: true,
    },
    with: { supplier: { columns: { name: true } } },
  });
  if (!link) return null;

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(schema.syncChanges)
    .where(and(eq(schema.syncChanges.productId, productId), eq(schema.syncChanges.status, "pending")));

  return { ...link, pendingChanges: pending };
}

export { getProductSupplierLink };
