"use cache";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { Address } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all addresses for a user
 */
async function getAddressesByUserId(userId: string): Promise<Address[]> {
  cacheTag(CACHE_TAGS.addresses(userId));

  return db.query.addresses.findMany({
    where: and(eq(schema.addresses.userId, userId)),
    orderBy: (addresses, { desc }) => [desc(addresses.isDefault), desc(addresses.createdAt)],
  });
}

export { getAddressesByUserId };
