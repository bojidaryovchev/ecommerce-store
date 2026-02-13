"use server";

import { calculateCartSummary } from "@/lib/cart-utils";
import type { ActionResult } from "@/types/action-result.type";
import { getCart } from "./get-cart.mutation";

/**
 * Get cart summary (for navbar badge, etc.)
 */
async function getCartSummary(): Promise<ActionResult<{ itemCount: number; subtotal: number; currency: string }>> {
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

export { getCartSummary };
