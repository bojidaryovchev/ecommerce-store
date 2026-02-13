"use server";

import { getCartBySessionId, getOrCreateCartForUser } from "@/queries/cart";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { CART_SESSION_COOKIE } from "./get-cart.mutation";

/**
 * Merge guest cart into user cart on login
 */
async function mergeGuestCartToUser(userId: string): Promise<ActionResult<void>> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

    if (!sessionId) {
      return { success: true, data: undefined };
    }

    const guestCart = await getCartBySessionId(sessionId);
    if (!guestCart || guestCart.items.length === 0) {
      return { success: true, data: undefined };
    }

    const userCart = await getOrCreateCartForUser(userId);

    // Merge items from guest cart to user cart
    for (const item of guestCart.items) {
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(schema.cartItems.cartId, userCart.id),
          eq(schema.cartItems.productId, item.productId),
          eq(schema.cartItems.priceId, item.priceId),
        ),
      });

      if (existingItem) {
        // Update quantity
        await db
          .update(schema.cartItems)
          .set({
            quantity: existingItem.quantity + item.quantity,
            updatedAt: new Date(),
          })
          .where(eq(schema.cartItems.id, existingItem.id));
      } else {
        // Move item to user cart
        await db.insert(schema.cartItems).values({
          cartId: userCart.id,
          productId: item.productId,
          priceId: item.priceId,
          quantity: item.quantity,
        });
      }
    }

    // Delete guest cart and its items
    await db.delete(schema.cartItems).where(eq(schema.cartItems.cartId, guestCart.id));
    await db.delete(schema.carts).where(eq(schema.carts.id, guestCart.id));

    // Clear the session cookie
    cookieStore.delete(CART_SESSION_COOKIE);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge cart",
    };
  }
}

export { mergeGuestCartToUser };
