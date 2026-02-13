"use server";

import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/**
 * Remove an item from the cart
 */
async function removeFromCart(cartItemId: string): Promise<ActionResult<CartWithItems>> {
  try {
    const cartItem = await db.query.cartItems.findFirst({
      where: eq(schema.cartItems.id, cartItemId),
      with: { cart: true },
    });

    if (!cartItem) {
      return {
        success: false,
        error: "Cart item not found",
      };
    }

    // Verify ownership
    const session = await auth();
    if (session?.user?.id) {
      if (cartItem.cart.userId !== session.user.id) {
        return { success: false, error: "Cart item not found" };
      }
    } else {
      const cookieStore = await cookies();
      const sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;
      if (cartItem.cart.sessionId !== sessionId) {
        return { success: false, error: "Cart item not found" };
      }
    }

    const cartId = cartItem.cartId;

    await db.delete(schema.cartItems).where(eq(schema.cartItems.id, cartItemId));

    // Fetch updated cart
    const updatedCart = await db.query.carts.findFirst({
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

    return {
      success: true,
      data: updatedCart as CartWithItems,
    };
  } catch (error) {
    console.error("Error removing from cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove item from cart",
    };
  }
}

export { removeFromCart };
