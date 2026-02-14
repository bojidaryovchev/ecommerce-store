import type { ProductWithPrices } from "@/types/product.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";

/**
 * Get all wishlisted products for a user.
 * Not cached — wishlist data is user-specific and changes frequently.
 */
async function getWishlistByUserId(userId: string): Promise<ProductWithPrices[]> {
  const wishlistItems = await db.query.wishlists.findMany({
    where: eq(schema.wishlists.userId, userId),
    with: {
      product: {
        with: {
          prices: true,
        },
      },
    },
    orderBy: (wishlists, { desc }) => [desc(wishlists.createdAt)],
  });

  return wishlistItems.map((item) => item.product).filter((product) => product.active) as ProductWithPrices[];
}

export { getWishlistByUserId };
