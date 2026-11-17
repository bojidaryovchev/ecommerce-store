"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import { applySyncChange } from "@ecommerce/supplier-sync";

/**
 * Accepts a review-queue entry (publish a new product, take the supplier's new price, …).
 */
async function applySyncChangeAction(changeId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    const { productId } = await applySyncChange(db, changeId, session?.user?.id ?? null);
    revalidateCatalog(productId ? [productId] : [], { immediate: true });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error applying sync change:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to apply change" };
  }
}

export { applySyncChangeAction };
