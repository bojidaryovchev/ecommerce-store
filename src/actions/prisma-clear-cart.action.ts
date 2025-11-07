"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";

export async function prismaClearCart(cartId: string): Promise<ActionResult<{ success: true }>> {
  try {
    await prisma.cartItem.deleteMany({
      where: { cartId },
    });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clear cart",
    };
  }
}
