"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { syncSupplierCatalog } from "@/lib/supplier-sync";
import type { ActionResult } from "@/types/action-result.type";
import type { SyncMode, SyncRunResult } from "@ecommerce/supplier-sync";

/**
 * Runs a supplier sync now (admin "Sync now" / "Full refresh" buttons).
 */
async function runSupplierSyncNow(
  mode: SyncMode,
): Promise<ActionResult<Pick<SyncRunResult, "status" | "message" | "stats">>> {
  try {
    await requireAdmin();
    const result = await syncSupplierCatalog({ mode, trigger: "manual", immediate: true });
    if (result.status === "failed") {
      return { success: false, error: result.message ?? "Sync failed" };
    }
    return { success: true, data: { status: result.status, message: result.message, stats: result.stats } };
  } catch (error) {
    console.error("Error running supplier sync:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to run supplier sync" };
  }
}

export { runSupplierSyncNow };
