"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { revalidateCatalog } from "@/lib/supplier-sync";
import type { ActionResult } from "@/types/action-result.type";
import { db } from "@ecommerce/database";
import { dismissSyncChange } from "@ecommerce/supplier-sync";

/**
 * Rejects a review-queue entry; our product stays as it is.
 */
async function dismissSyncChangeAction(changeId: string): Promise<ActionResult> {
  try {
    const session = await requireAdmin();
    await dismissSyncChange(db, changeId, session?.user?.id ?? null);
    revalidateCatalog([], { immediate: true });
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error dismissing sync change:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to dismiss change" };
  }
}

export { dismissSyncChangeAction };
