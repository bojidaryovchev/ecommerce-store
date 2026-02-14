import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";

/**
 * Check whether a user has already reviewed a product.
 * Prevents duplicate reviews.
 */
async function checkUserAlreadyReviewed(userId: string, productId: string): Promise<boolean> {
  const existing = await db.query.reviews.findFirst({
    where: and(eq(schema.reviews.userId, userId), eq(schema.reviews.productId, productId)),
    columns: { id: true },
  });

  return !!existing;
}

export { checkUserAlreadyReviewed };
