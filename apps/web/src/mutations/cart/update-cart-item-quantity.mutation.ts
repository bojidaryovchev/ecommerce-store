"use server";

import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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
    });

    if (!cartItem) {
      return {
        success: false,
        error: "Cart item not found",
      };
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

    revalidatePath("/");
    revalidatePath("/cart");

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
