import { CACHE_TAGS } from "@/lib/cache-tags";
import { sendStockAlerts } from "@/lib/stock-alerts";
import { db } from "@ecommerce/database";
import { runSupplierSync, type SyncMode, type SyncRunResult, type SyncTrigger } from "@ecommerce/supplier-sync";
import { revalidateTag, updateTag } from "next/cache";

/**
 * Expires the cached pages a catalog change affects.
 * `immediate` (Server Actions only) makes the admin see their own change on the next render.
 */
export function revalidateCatalog(
  productIds: Iterable<string>,
  options: { categoriesChanged?: boolean; immediate?: boolean } = {},
): void {
  const expire = (tag: string) => (options.immediate ? updateTag(tag) : revalidateTag(tag, { expire: 0 }));
  expire(CACHE_TAGS.supplierSync);
  const ids = [...new Set(productIds)];
  if (ids.length > 0) {
    expire(CACHE_TAGS.products);
    for (const id of ids) expire(CACHE_TAGS.product(id));
  }
  if (options.categoriesChanged) expire(CACHE_TAGS.categories);
}

/** Runs a supplier sync against the app database and refreshes affected pages. */
export async function syncSupplierCatalog(options: {
  mode: SyncMode;
  trigger: SyncTrigger;
  supplier?: string;
  immediate?: boolean;
}): Promise<SyncRunResult> {
  const result = await runSupplierSync({
    db,
    mode: options.mode,
    trigger: options.trigger,
    supplier: options.supplier,
  });
  revalidateCatalog(result.changedProductIds, {
    categoriesChanged: result.categoriesChanged,
    immediate: options.immediate,
  });
  // Stock changes with the sync: tell whoever asked about a product that is back. Never fails the sync.
  try {
    const alerts = await sendStockAlerts();
    if (alerts.sent + alerts.failed + alerts.expired > 0) console.log("[stock-alerts]", alerts);
  } catch (error) {
    console.error("[stock-alerts] Could not send the stock alerts:", error);
  }
  return result;
}
