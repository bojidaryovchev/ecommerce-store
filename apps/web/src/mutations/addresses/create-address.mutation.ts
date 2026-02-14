"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Address } from "@ecommerce/database";
import { db, insertAddressSchema, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Create a new address for the authenticated user
 */
async function createAddress(
  data: Omit<typeof schema.addresses.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">,
): Promise<ActionResult<Address>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    const validated = insertAddressSchema.parse({
      ...data,
      userId,
    });

    // If this is set as default, unset other defaults of the same type
    if (validated.isDefault) {
      await db
        .update(schema.addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.type, validated.type!)));
    }

    const [address] = await db.insert(schema.addresses).values(validated).returning();

    revalidateTag(CACHE_TAGS.addresses(userId), "max");

    return { success: true, data: address };
  } catch (error) {
    console.error("Error creating address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create address",
    };
  }
}

export { createAddress };
