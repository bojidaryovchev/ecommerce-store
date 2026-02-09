"use server";

import { auth } from "@/lib/auth";
import { calculateCartSummary } from "@/lib/cart-utils";
import {
  getCartBySessionId,
  getCartByUserId,
  getOrCreateCartForSession,
  getOrCreateCartForUser,
} from "@/lib/queries/cart";
import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { db, schema } from "@ecommerce/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

const CART_SESSION_COOKIE = "cart_session_id";

/**
 * Get or generate a session ID for guest users
 */
async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(CART_SESSION_COOKIE)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    cookieStore.set(CART_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  return sessionId;
}

/**
 * Get the current user's cart (authenticated or guest)
 */
export async function getCart(): Promise<ActionResult<CartWithItems | null>> {
  try {
    const session = await auth();

    if (session?.user?.id) {
      const cart = await getCartByUserId(session.user.id);
      return { success: true, data: cart ?? null };
    }

    const sessionId = await getOrCreateSessionId();
    const cart = await getCartBySessionId(sessionId);
    return { success: true, data: cart ?? null };
  } catch (error) {
    console.error("Error getting cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get cart",
    };
  }
}

/**
 * Add an item to the cart
 */
export async function addToCart(
  productId: string,
  priceId: string,
  quantity: number = 1,
): Promise<ActionResult<CartWithItems>> {
  try {
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

    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/cart");

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

/**
 * Update the quantity of a cart item
 */
export async function updateCartItemQuantity(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult<CartWithItems>> {
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

/**
 * Remove an item from the cart
 */
export async function removeFromCart(cartItemId: string): Promise<ActionResult<CartWithItems>> {
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

/**
 * Clear all items from the cart
 */
export async function clearCart(): Promise<ActionResult<void>> {
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

    revalidatePath("/");
    revalidatePath("/cart");

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

/**
 * Merge guest cart into user cart on login
 */
export async function mergeGuestCartToUser(userId: string): Promise<ActionResult<void>> {
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

    revalidatePath("/");
    revalidatePath("/cart");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error merging guest cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge cart",
    };
  }
}

/**
 * Get cart summary (for navbar badge, etc.)
 */
export async function getCartSummary(): Promise<
  ActionResult<{ itemCount: number; subtotal: number; currency: string }>
> {
  try {
    const cartResult = await getCart();

    if (!cartResult.success) {
      return cartResult;
    }

    const summary = calculateCartSummary(cartResult.data);

    return {
      success: true,
      data: summary,
    };
  } catch (error) {
    console.error("Error getting cart summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get cart summary",
    };
  }
}
