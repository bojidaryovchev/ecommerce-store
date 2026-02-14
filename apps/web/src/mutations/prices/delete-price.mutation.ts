"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Delete a price
 */
async function deletePrice(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const price = await db.query.prices.findFirst({
      where: eq(schema.prices.id, id),
    });

    if (!price) {
      return {
        success: false,
        error: "Price not found",
      };
    }

    // Set active to false instead of hard delete
    await db.update(schema.prices).set({ active: false, updatedAt: new Date() }).where(eq(schema.prices.id, id));

    // If this was the default price, set another price as default
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, price.productId),
    });

    if (product?.defaultPriceId === id) {
      const newDefaultPrice = await db.query.prices.findFirst({
        where: eq(schema.prices.productId, price.productId),
      });

      await db
        .update(schema.products)
        .set({
          defaultPriceId: newDefaultPrice?.id ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.products.id, price.productId));
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(price.productId), "max");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error deleting price:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete price",
    };
  }
}

export { deletePrice };
