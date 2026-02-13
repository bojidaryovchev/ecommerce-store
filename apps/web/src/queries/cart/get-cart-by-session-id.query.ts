import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Get a cart by session ID (for guest users) with all items
 */
const getCartBySessionId = cache(async (sessionId: string) => {
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.sessionId, sessionId),
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

export { getCartBySessionId };
