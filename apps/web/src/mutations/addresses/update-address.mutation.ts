"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Address } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Update an existing address (must belong to the authenticated user)
 */
async function updateAddress(
  id: string,
  data: Partial<Omit<typeof schema.addresses.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">>,
): Promise<ActionResult<Address>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const userId = session.user.id;

    // Verify ownership
    const existing = await db.query.addresses.findFirst({
      where: and(eq(schema.addresses.id, id), eq(schema.addresses.userId, userId)),
    });

    if (!existing) {
      return { success: false, error: "Address not found" };
    }

    // If setting as default, unset other defaults of the same type
    const addressType = data.type ?? existing.type;
    if (data.isDefault) {
      await db
        .update(schema.addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(eq(schema.addresses.userId, userId), eq(schema.addresses.type, addressType)));
    }

    const [address] = await db
      .update(schema.addresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.addresses.id, id))
      .returning();

    revalidateTag(CACHE_TAGS.addresses(userId), "max");

    return { success: true, data: address };
  } catch (error) {
    console.error("Error updating address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update address",
    };
  }
}

export { updateAddress };
