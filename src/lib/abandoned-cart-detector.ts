import { prisma } from "@/lib/prisma";
import type { Cart, CartItem, Product, ProductVariant } from "@prisma/client";

/**
 * Configuration for abandoned cart detection
 */
export interface AbandonmentConfig {
  // Time in hours before a cart is considered abandoned
  abandonmentThreshold: number;
  // Minimum cart value to track (in dollars)
  minimumCartValue: number;
  // Maximum reminders to send per cart
  maxReminders: number;
  // Time between reminders in hours
  reminderIntervals: number[];
}

/**
 * Default configuration
 */
export const DEFAULT_ABANDONMENT_CONFIG: AbandonmentConfig = {
  abandonmentThreshold: 1, // 1 hour
  minimumCartValue: 10, // $10
  maxReminders: 3,
  reminderIntervals: [1, 24, 72], // 1 hour, 24 hours, 3 days
};

/**
 * Cart with full relations for abandonment detection
 */
export type CartWithDetails = Cart & {
  items: (CartItem & {
    product: Product & {
      images: { url: string }[];
    };
    variant: ProductVariant | null;
  })[];
  user: {
    id: string;
    email: string | null;
    name: string | null;
  } | null;
};

/**
 * Abandoned cart candidate
 */
export interface AbandonedCartCandidate {
  cartId: string;
  userEmail: string;
  userName: string | null;
  itemCount: number;
  cartTotal: number;
  items: {
    productId: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    variantId: string | null;
    variantName: string | null;
    quantity: number;
    price: number;
  }[];
  lastUpdated: Date;
}

/**
 * Detect carts that have been abandoned
 * A cart is considered abandoned if:
 * - It has items
 * - It hasn't been updated for X hours (threshold)
 * - It has a user email (either from user or from AbandonedCart record)
 * - It hasn't resulted in an order yet
 * - It's not already marked as abandoned (or needs a new reminder)
 */
export async function detectAbandonedCarts(
  config: AbandonmentConfig = DEFAULT_ABANDONMENT_CONFIG,
): Promise<AbandonedCartCandidate[]> {
  const thresholdDate = new Date();
  thresholdDate.setHours(thresholdDate.getHours() - config.abandonmentThreshold);

  // Find carts that haven't been updated recently and have items
  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: {
        lt: thresholdDate,
      },
      items: {
        some: {}, // Has at least one item
      },
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                take: 1,
                orderBy: {
                  position: "asc",
                },
              },
            },
          },
          variant: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      abandonedCart: true,
    },
  });

  const candidates: AbandonedCartCandidate[] = [];

  for (const cart of carts) {
    // Skip if no items
    if (cart.items.length === 0) continue;

    // Calculate cart total
    let cartTotal = 0;
    for (const item of cart.items) {
      const price = item.variant ? item.variant.price : item.product.price;
      cartTotal += Number(price) * item.quantity;
    }

    // Skip if below minimum value
    if (cartTotal < config.minimumCartValue) continue;

    // Check if cart has user email
    const userEmail = cart.user?.email;

    // Skip if no email (can't send recovery email)
    if (!userEmail) continue;

    // Check if already abandoned and at max reminders
    if (cart.abandonedCart) {
      if (cart.abandonedCart.remindersSent >= config.maxReminders) {
        continue; // Already sent max reminders
      }

      // Check if it's time for next reminder
      const nextReminderInterval = config.reminderIntervals[cart.abandonedCart.remindersSent];
      if (nextReminderInterval === undefined) {
        continue; // No more reminders scheduled
      }

      const nextReminderDate = new Date(
        cart.abandonedCart.lastReminderSent?.getTime() || cart.abandonedCart.abandonedAt.getTime(),
      );
      nextReminderDate.setHours(nextReminderDate.getHours() + nextReminderInterval);

      if (new Date() < nextReminderDate) {
        continue; // Not time for next reminder yet
      }

      // Check if already recovered
      if (cart.abandonedCart.isRecovered) {
        continue; // Cart was recovered
      }
    }

    // Check if cart items were already ordered
    // (This prevents sending emails for carts that were already converted)
    const hasOrder = await prisma.order.findFirst({
      where: {
        userId: cart.userId || undefined,
        items: {
          some: {
            productId: {
              in: cart.items.map((item) => item.productId),
            },
          },
        },
        createdAt: {
          gte: cart.createdAt,
        },
      },
    });

    if (hasOrder) continue;

    // Format items for email
    const items = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      productSlug: item.product.slug,
      productImage: item.product.images[0]?.url || null,
      variantId: item.variantId,
      variantName: item.variant?.name || null,
      quantity: item.quantity,
      price: Number(item.variant?.price || item.product.price),
    }));

    candidates.push({
      cartId: cart.id,
      userEmail,
      userName: cart.user?.name || null,
      itemCount: cart.items.length,
      cartTotal,
      items,
      lastUpdated: cart.updatedAt,
    });
  }

  return candidates;
}

/**
 * Mark a cart as abandoned and create recovery token
 */
export async function markCartAsAbandoned(
  candidate: AbandonedCartCandidate,
): Promise<{ abandonedCartId: string; recoveryToken: string }> {
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days

  const abandonedCart = await prisma.abandonedCart.upsert({
    where: {
      cartId: candidate.cartId,
    },
    create: {
      cartId: candidate.cartId,
      userEmail: candidate.userEmail,
      userName: candidate.userName,
      itemCount: candidate.itemCount,
      cartTotal: candidate.cartTotal,
      itemsSnapshot: candidate.items,
      tokenExpiresAt,
      abandonedAt: new Date(),
    },
    update: {
      remindersSent: {
        increment: 1,
      },
      lastReminderSent: new Date(),
    },
  });

  return {
    abandonedCartId: abandonedCart.id,
    recoveryToken: abandonedCart.recoveryToken,
  };
}

/**
 * Get abandoned cart by recovery token
 */
export async function getAbandonedCartByToken(token: string) {
  const abandonedCart = await prisma.abandonedCart.findUnique({
    where: {
      recoveryToken: token,
    },
    include: {
      cart: {
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: {
                    take: 1,
                    orderBy: {
                      position: "asc",
                    },
                  },
                },
              },
              variant: true,
            },
          },
        },
      },
    },
  });

  if (!abandonedCart) return null;

  // Check if token is expired
  if (new Date() > abandonedCart.tokenExpiresAt) {
    return null;
  }

  // Check if already recovered
  if (abandonedCart.isRecovered) {
    return null;
  }

  return abandonedCart;
}

/**
 * Mark cart as recovered
 */
export async function markCartAsRecovered(
  abandonedCartId: string,
  orderId?: string,
  channel: string = "email",
): Promise<void> {
  await prisma.abandonedCart.update({
    where: {
      id: abandonedCartId,
    },
    data: {
      isRecovered: true,
      recoveredAt: new Date(),
      orderCreated: !!orderId,
      orderId,
      recoveryChannel: channel,
    },
  });
}

/**
 * Check if a cart is abandoned
 */
export async function isCartAbandoned(cartId: string): Promise<boolean> {
  const abandonedCart = await prisma.abandonedCart.findUnique({
    where: { cartId },
  });

  return abandonedCart !== null && !abandonedCart.isRecovered;
}

/**
 * Calculate recovery rate for analytics
 */
export async function getRecoveryStats(startDate: Date, endDate: Date) {
  const abandoned = await prisma.abandonedCart.findMany({
    where: {
      abandonedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const total = abandoned.length;
  const recovered = abandoned.filter((cart) => cart.isRecovered).length;
  const ordersCreated = abandoned.filter((cart) => cart.orderCreated).length;
  const totalRevenue = abandoned
    .filter((cart) => cart.orderCreated)
    .reduce((sum, cart) => sum + Number(cart.cartTotal), 0);

  return {
    totalAbandoned: total,
    recovered,
    recoveryRate: total > 0 ? (recovered / total) * 100 : 0,
    ordersCreated,
    conversionRate: total > 0 ? (ordersCreated / total) * 100 : 0,
    revenueRecovered: totalRevenue,
  };
}
