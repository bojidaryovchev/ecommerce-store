import { db, schema } from "@ecommerce/database";
import { getCartBySessionId } from "./get-cart-by-session-id.query";

/**
 * Get or create a cart for a guest session
 */
async function getOrCreateCartForSession(sessionId: string) {
  let cart = await getCartBySessionId(sessionId);

  if (!cart) {
    const [newCart] = await db.insert(schema.carts).values({ sessionId }).returning();

    cart = {
      ...newCart,
      items: [],
    };
  }

  return cart;
}

export { getOrCreateCartForSession };
