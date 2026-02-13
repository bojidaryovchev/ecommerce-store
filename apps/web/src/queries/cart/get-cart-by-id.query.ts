import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Get a cart by ID with all items
 */
const getCartById = cache(async (cartId: string) => {
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.id, cartId),
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

export { getCartById };
