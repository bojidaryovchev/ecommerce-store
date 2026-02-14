"use server";

import { auth } from "@/lib/auth";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";

/**
 * Toggle a product in the user's wishlist.
 * If already wishlisted, removes it. If not, adds it.
 * Returns whether the product is now wishlisted.
 */
async function toggleWishlist(productId: string): Promise<ActionResult<{ wishlisted: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "You must be signed in to use the wishlist" };
    }

    const userId = session.user.id;

    // Check if already wishlisted
    const existing = await db.query.wishlists.findFirst({
      where: and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId)),
      columns: { id: true },
    });

    if (existing) {
      // Remove from wishlist
      await db.delete(schema.wishlists).where(eq(schema.wishlists.id, existing.id));
      return { success: true, data: { wishlisted: false } };
    }

    // Add to wishlist
    await db.insert(schema.wishlists).values({
      userId,
      productId,
    });

    return { success: true, data: { wishlisted: true } };
  } catch (error) {
    console.error("Error toggling wishlist:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update wishlist",
    };
  }
}

export { toggleWishlist };
