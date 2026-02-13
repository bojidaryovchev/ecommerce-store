"use server";

import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Remove an item from the cart
 */
async function removeFromCart(cartItemId: string): Promise<ActionResult<CartWithItems>> {
  try {
    const cartItem = await db.query.cartItems.findFirst({
      where: eq(schema.cartItems.id, cartItemId),
    });

    if (!cartItem) {
      return {
        success: false,
        error: "Cart item not found",
      };
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

    revalidatePath("/");
    revalidatePath("/cart");

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
