"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Price } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
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
