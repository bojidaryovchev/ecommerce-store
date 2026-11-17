"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import { publishAllNewProducts } from "@ecommerce/supplier-sync";

/**
 * Publishes every product waiting in the review queue as "new".
 */
async function publishAllNewProductsAction(): Promise<ActionResult<{ count: number }>> {
  try {
    const session = await requireAdmin();
    const { productIds } = await publishAllNewProducts(db, session?.user?.id ?? null);
    revalidateCatalog(productIds, { immediate: true });
    return { success: true, data: { count: productIds.length } };
  } catch (error) {
    console.error("Error publishing new products:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to publish products" };
  }
}

export { publishAllNewProductsAction };
