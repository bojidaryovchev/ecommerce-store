import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Cart queries use React's cache() for request-level deduplication only.
 * Cart data is user-specific and changes frequently, so we don't use
 * cross-request caching with "use cache" - it would cause stale data issues.
 */

/**
 * Get a cart by user ID with all items and related product/price data
 */
export const getCartByUserId = cache(async (userId: string) => {
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.userId, userId),
    with: {
      items: {
        with: {
          product: true,
          price: true,
        },
      },
    },
  });

  return cart;
});

/**
 * Get a cart by session ID (for guest users) with all items
 */
export const getCartBySessionId = cache(async (sessionId: string) => {
  const cart = await db.query.carts.findFirst({
    where: eq(schema.carts.sessionId, sessionId),
    with: {
      items: {
        with: {
          product: true,
          price: true,
        },
      },
    },
  });

  return cart;
});

/**
 * Get a cart by ID with all items
 */
export const getCartById = cache(async (cartId: string) => {
  const cart = await db.query.carts.findFirst({
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

  return cart;
});

/**
 * Get or create a cart for a user
 */
export const getOrCreateCartForUser = async (userId: string) => {
  let cart = await getCartByUserId(userId);

  if (!cart) {
    const [newCart] = await db.insert(schema.carts).values({ userId }).returning();

    cart = {
      ...newCart,
      items: [],
    };
  }

  return cart;
};

/**
 * Get or create a cart for a guest session
 */
export const getOrCreateCartForSession = async (sessionId: string) => {
  let cart = await getCartBySessionId(sessionId);

  if (!cart) {
    const [newCart] = await db.insert(schema.carts).values({ sessionId }).returning();

    cart = {
      ...newCart,
      items: [],
    };
  }

  return cart;
};

// calculateCartSummary moved to @/lib/cart-utils.ts for client-side use
