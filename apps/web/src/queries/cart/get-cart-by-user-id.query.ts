import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Get a cart by user ID with all items and related product/price data
 */
const getCartByUserId = cache(async (userId: string) => {
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.userId, userId),
    with: {
      items: {
        with: {
          product: true,
          price: true,
        },
      },
    },
  });

  return cart;
});

export { getCartByUserId };
