"use server";

import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Clear all items from the cart
 */
async function clearCart(): Promise<ActionResult<void>> {
  try {
    const session = await auth();
    let cart;

    if (session?.user?.id) {
      cart = await getCartByUserId(session.user.id);
    } else {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
      if (sessionId) {
        cart = await getCartBySessionId(sessionId);
      }
    }

    if (cart) {
      await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, cart.id));
    }

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
}

export { clearCart };
