"use server";

import { auth } from "@/lib/auth";
import { CART_SESSION_COOKIE } from "@/lib/cart-utils";
import { getCartBySessionId, getCartByUserId } from "@/queries/cart";
import type { ActionResult } from "@/types/action-result.type";
import type { CartWithItems } from "@/types/cart.type";
import { cookies } from "next/headers";

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
async function getCart(): Promise<ActionResult<CartWithItems | null>> {
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

export { getCart, getOrCreateSessionId };
