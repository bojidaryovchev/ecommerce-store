"use server";

import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { removeFromCart } from "./remove-from-cart.mutation";

/**
 * Update the quantity of a cart item
 */
async function updateCartItemQuantity(cartItemId: string, quantity: number): Promise<ActionResult<CartWithItems>> {
  try {
    if (quantity < 1) {
      return await removeFromCart(cartItemId);
    }

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

    await db
      .update(schema.cartItems)
      .set({
        quantity,
        updatedAt: new Date(),
      })
      .where(eq(schema.cartItems.id, cartItemId));

    // Fetch updated cart
    const updatedCart = await db.query.carts.findFirst({
      where: eq(schema.carts.id, cartItem.cartId),
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
    console.error("Error updating cart item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update cart item",
    };
  }
}

export { updateCartItemQuantity };
