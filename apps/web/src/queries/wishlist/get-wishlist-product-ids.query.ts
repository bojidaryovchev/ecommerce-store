import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";

/**
 * Get the list of product IDs in a user's wishlist.
 * Used to check if a product is wishlisted (for heart icon state).
 * Returns a plain array (not Set) so it can be serialized across server/client boundary.
 * Not cached — wishlist data is user-specific and changes frequently.
 */
async function getWishlistProductIds(userId: string): Promise<string[]> {
  const items = await db
    .select({ productId: schema.wishlists.productId })
    .from(schema.wishlists)
    .where(eq(schema.wishlists.userId, userId));

  return items.map((item) => item.productId);
}

/**
 * Check if a specific product is in a user's wishlist
 */
async function isProductWishlisted(userId: string, productId: string): Promise<boolean> {
  const item = await db.query.wishlists.findFirst({
    where: and(eq(schema.wishlists.userId, userId), eq(schema.wishlists.productId, productId)),
    columns: { id: true },
  });

  return !!item;
}

export { getWishlistProductIds, isProductWishlisted };
