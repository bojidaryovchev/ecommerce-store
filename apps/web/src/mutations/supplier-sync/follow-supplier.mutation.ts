"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import { followSupplierForField, isLockableField } from "@ecommerce/supplier-sync";

/**
 * Drops our override of one field and takes the supplier's current value again.
 */
async function followSupplierAction(productId: string, field: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    if (!isLockableField(field)) {
      return { success: false, error: `Unknown field: ${field}` };
    }
    await followSupplierForField(db, productId, field);
    revalidateCatalog([productId], { immediate: true });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error restoring supplier value:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to restore supplier value" };
  }
}

export { followSupplierAction };
