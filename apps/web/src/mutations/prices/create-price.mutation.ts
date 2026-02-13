"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Price } from "@ecommerce/database";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

/**
 * Create a new price for a product
 */
async function createPrice(data: {
  productId: string;
  unitAmount?: number | null;
  currency?: string;
  active?: boolean;
  nickname?: string | null;
  type?: "one_time" | "recurring";
}): Promise<ActionResult<Price>> {
  try {
    const [price] = await db
      .insert(schema.prices)
      .values({
        productId: data.productId,
        unitAmount: data.unitAmount ?? null,
        currency: data.currency ?? "usd",
        active: data.active ?? true,
        nickname: data.nickname ?? null,
        type: data.type ?? "one_time",
      })
      .returning();

    // If this is the first price, set it as the default
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, data.productId),
      with: {
        prices: true,
      },
    });

    if (product && product.prices.length === 1) {
      await db
        .update(schema.products)
        .set({ defaultPriceId: price.id, updatedAt: new Date() })
        .where(eq(schema.products.id, data.productId));
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(data.productId), "max");

    return {
      success: true,
      data: price,
    };
  } catch (error) {
    console.error("Error creating price:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create price",
    };
  }
}

export { createPrice };
