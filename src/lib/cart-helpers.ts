import { prisma } from "@/lib/prisma";

const GUEST_CART_EXPIRATION_DAYS = 7;

/**
 * Updates the lastActivityAt timestamp for a cart
 * Should be called on any cart mutation operation (add, update, remove items)
 */
export async function updateCartActivity(cartId: string): Promise<void> {
  try {
    await prisma.cart.update({
      where: { id: cartId },
      data: { lastActivityAt: new Date() },
    });
  } catch (error) {
    console.error(`Error updating cart activity for cart ${cartId}:`, error);
    // Don't throw - activity tracking is non-critical
  }
}

/**
 * Calculates expiration date for guest carts
 * Returns null for authenticated user carts (they don't expire)
 */
export function calculateCartExpiration(isGuestCart: boolean): Date | null {
  if (!isGuestCart) {
    return null;
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + GUEST_CART_EXPIRATION_DAYS);
  return expirationDate;
}

/**
 * Extends the expiration date for a guest cart
 * Should be called when guest cart is modified to reset the expiration timer
 */
export async function extendCartExpiration(cartId: string): Promise<void> {
  try {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: { sessionId: true, userId: true },
    });

    // Only extend expiration for guest carts
    if (cart?.sessionId && !cart.userId) {
      const newExpiresAt = calculateCartExpiration(true);
      await prisma.cart.update({
        where: { id: cartId },
        data: { expiresAt: newExpiresAt },
      });
    }
  } catch (error) {
    console.error(`Error extending cart expiration for cart ${cartId}:`, error);
    // Don't throw - expiration extension is non-critical
  }
}

/**
 * Manually marks inactive guest carts as expired
 * Note: MongoDB TTL index will automatically delete expired carts,
 * but this can be used for manual expiration logic if needed
 */
export async function markExpiredCarts(): Promise<number> {
  try {
    const result = await prisma.cart.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        status: "ACTIVE",
      },
      data: { status: "EXPIRED" },
    });

    return result.count;
  } catch (error) {
    console.error("Error marking expired carts:", error);
    return 0;
  }
}
