"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { addLocks } from "@ecommerce/supplier-sync";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Set the price customers pay for a product (its default price), creating it if needed.
 * On a supplier-synced product this locks the price, so the sync stops changing it.
 */
async function setProductPrice(productId: string, unitAmount: number, currency: string): Promise<ActionResult> {
  try {
    await requireAdmin();

    if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
      return { success: false, error: "Price must be a positive amount" };
    }

    const found = await db.transaction(async (tx) => {
      const product = await tx.query.products.findFirst({
        where: eq(schema.products.id, productId),
        columns: { id: true, lockedFields: true },
        with: { defaultPrice: true, supplierProduct: { columns: { id: true } } },
      });
      if (!product) return false;

      const now = new Date();
      const current = product.defaultPrice;
      const changed = !current || !current.active || current.unitAmount !== unitAmount || current.currency !== currency;
      if (!changed) return true;

      if (current) {
        await tx
          .update(schema.prices)
          .set({ unitAmount, unitAmountDecimal: String(unitAmount), currency, active: true, updatedAt: now })
          .where(eq(schema.prices.id, current.id));
      } else {
        const [price] = await tx
          .insert(schema.prices)
          .values({ productId, unitAmount, unitAmountDecimal: String(unitAmount), currency, active: true })
          .returning({ id: schema.prices.id });
        await tx
          .update(schema.products)
          .set({ defaultPriceId: price.id, updatedAt: now })
          .where(eq(schema.products.id, productId));
      }

      if (product.supplierProduct) {
        await tx
          .update(schema.products)
          .set({ lockedFields: addLocks(product.lockedFields, ["price"]), updatedAt: now })
          .where(eq(schema.products.id, productId));
      }
      return true;
    });

    if (!found) {
      return { success: false, error: "Product not found" };
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(productId), "max");
    revalidateTag(CACHE_TAGS.supplierSync, "max");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("Error setting product price:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to set price" };
  }
}

export { setProductPrice };
