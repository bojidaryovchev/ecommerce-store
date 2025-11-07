"use server";

import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/types/action-result.type";

export async function prismaRemoveCartItem(cartItemId: string): Promise<ActionResult<{ success: true }>> {
  try {
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error("Error removing cart item:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove cart item",
    };
  }
}
