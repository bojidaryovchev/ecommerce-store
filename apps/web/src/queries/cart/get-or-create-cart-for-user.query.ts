import { db, schema } from "@ecommerce/database";
import { getCartByUserId } from "./get-cart-by-user-id.query";

/**
 * Get or create a cart for a user
 */
async function getOrCreateCartForUser(userId: string) {
  let cart = await getCartByUserId(userId);

  if (!cart) {
    const [newCart] = await db.insert(schema.carts).values({ userId }).returning();

    cart = {
      ...newCart,
      items: [],
    };
  }

  return cart;
}

export { getOrCreateCartForUser };
