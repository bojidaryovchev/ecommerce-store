"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Price } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { addLocks } from "@ecommerce/supplier-sync";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Update an existing price
 */
async function updatePrice(
  id: string,
  data: Partial<Omit<typeof schema.prices.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">>,
): Promise<ActionResult<Price>> {
  try {
    await requireAdmin();

    const [price] = await db
      .update(schema.prices)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.prices.id, id))
      .returning();

    if (!price) {
      return {
        success: false,
        error: "Price not found",
      };
    }

    // Editing the price customers pay on a supplier-synced product stops it following the supplier.
    if (data.unitAmount !== undefined) {
      const product = await db.query.products.findFirst({
        where: eq(schema.products.id, price.productId),
        columns: { id: true, defaultPriceId: true, lockedFields: true },
        with: { supplierProduct: { columns: { id: true } } },
      });
      if (product?.supplierProduct && product.defaultPriceId === price.id) {
        await db
          .update(schema.products)
          .set({ lockedFields: addLocks(product.lockedFields, ["price"]), updatedAt: new Date() })
          .where(eq(schema.products.id, product.id));
      }
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(price.productId), "max");

    return {
      success: true,
      data: price,
    };
  } catch (error) {
    console.error("Error updating price:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update price",
    };
  }
}

export { updatePrice };
