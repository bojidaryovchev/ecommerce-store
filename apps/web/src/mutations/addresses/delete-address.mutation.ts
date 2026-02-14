"use server";

import { auth } from "@/lib/auth";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Delete an address (must belong to the authenticated user)
 */
async function deleteAddress(id: string): Promise<ActionResult<void>> {
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

    await db.delete(schema.addresses).where(eq(schema.addresses.id, id));

    revalidateTag(CACHE_TAGS.addresses(userId), "max");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error deleting address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete address",
    };
  }
}

export { deleteAddress };
