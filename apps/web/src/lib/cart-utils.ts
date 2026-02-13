import type { CartSummary } from "@/types/cart.type";

export const CART_SESSION_COOKIE = "cart_session_id";

/**
 * Calculate cart summary (item count, subtotal)
 * This is a pure function that can be used on both client and server
 */
export const calculateCartSummary = (
  cart: {
    items: Array<{
      quantity: number;
      price: { unitAmount: number | null; currency: string };
    }>;
  } | null,
): CartSummary => {
  if (!cart || !cart.items || cart.items.length === 0) {
    return {
      itemCount: 0,
      subtotal: 0,
      currency: "usd",
    };
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.items.reduce((sum, item) => {
    const unitAmount = item.price.unitAmount ?? 0;
    return sum + unitAmount * item.quantity;
  }, 0);
  const currency = cart.items[0]?.price.currency ?? "usd";

  return {
    itemCount,
    subtotal,
    currency,
  };
};
