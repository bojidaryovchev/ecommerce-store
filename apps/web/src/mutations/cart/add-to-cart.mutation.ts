"use server";

import { auth } from "@/lib/auth";
import { getOrCreateCartForSession, getOrCreateCartForUser } from "@/queries/cart";
import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { getOrCreateSessionId } from "./get-cart.mutation";

/**
 * Add an item to the cart
 */
async function addToCart(
  productId: string,
  priceId: string,
  quantity: number = 1,
): Promise<ActionResult<CartWithItems>> {
  try {
    // Validate product exists and is active
    const product = await db.query.products.findFirst({
      where: and(eq(schema.products.id, productId), eq(schema.products.active, true)),
    });

    if (!product) {
      return { success: false, error: "Product not found or unavailable" };
    }

    // Validate price exists, is active, and belongs to this product
    const price = await db.query.prices.findFirst({
      where: and(eq(schema.prices.id, priceId), eq(schema.prices.productId, productId), eq(schema.prices.active, true)),
    });

    if (!price) {
      return { success: false, error: "Price not found or unavailable" };
    }

    const session = await auth();
    let cart;

    if (session?.user?.id) {
      cart = await getOrCreateCartForUser(session.user.id);
    } else {
      const sessionId = await getOrCreateSessionId();
      cart = await getOrCreateCartForSession(sessionId);
    }

    // Check if item already exists in cart
    const existingItem = await db.query.cartItems.findFirst({
      where: and(
        eq(schema.cartItems.cartId, cart.id),
        eq(schema.cartItems.productId, productId),
        eq(schema.cartItems.priceId, priceId),
      ),
    });

    if (existingItem) {
      // Update quantity
      await db
        .update(schema.cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(schema.cartItems.id, existingItem.id));
    } else {
      // Add new item
      await db.insert(schema.cartItems).values({
        cartId: cart.id,
        productId,
        priceId,
        quantity,
      });
    }

    // Fetch updated cart
    const updatedCart = await db.query.carts.findFirst({
      where: eq(schema.carts.id, cart.id),
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
    console.error("Error adding to cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add item to cart",
    };
  }
}

export { addToCart };
