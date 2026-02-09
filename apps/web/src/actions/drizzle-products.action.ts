"use server";

import { CACHE_TAGS } from "@/lib/cache-tags";
import type { ActionResult } from "@/types/action-result.type";
import type { Price, Product } from "@ecommerce/database";
import { db, insertProductSchema, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import { linkUploads } from "./uploads.action";

/**
 * Create a new product
 */
export async function createProduct(
  data: Omit<typeof schema.products.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">,
): Promise<ActionResult<Product>> {
  try {
    const validated = insertProductSchema.parse(data);

    const [product] = await db.insert(schema.products).values(validated).returning();

    // Link the uploaded images if present
    if (product.images && product.images.length > 0) {
      await linkUploads(product.images, product.id, "product");
    }

    revalidateTag(CACHE_TAGS.products, "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error creating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<typeof schema.products.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">>,
): Promise<ActionResult<Product>> {
  try {
    const [product] = await db
      .update(schema.products)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, id))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Link the uploaded images if present (handles new images on update)
    if (data.images && data.images.length > 0) {
      await linkUploads(data.images, product.id, "product");
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

/**
 * Delete a product (soft delete by setting active to false)
 */
export async function deleteProduct(id: string): Promise<ActionResult<void>> {
  try {
    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, id),
    });

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Soft delete: set active to false
    await db.update(schema.products).set({ active: false, updatedAt: new Date() }).where(eq(schema.products.id, id));

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

/**
 * Restore a soft-deleted product
 */
export async function restoreProduct(id: string): Promise<ActionResult<Product>> {
  try {
    const [product] = await db
      .update(schema.products)
      .set({ active: true, updatedAt: new Date() })
      .where(eq(schema.products.id, id))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(id), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error restoring product:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to restore product",
    };
  }
}

/**
 * Create a new price for a product
 */
export async function createPrice(data: {
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

/**
 * Update an existing price
 */
export async function updatePrice(
  id: string,
  data: Partial<Omit<typeof schema.prices.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">>,
): Promise<ActionResult<Price>> {
  try {
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

/**
 * Delete a price
 */
export async function deletePrice(id: string): Promise<ActionResult<void>> {
  try {
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

/**
 * Set the default price for a product
 */
export async function setDefaultPrice(productId: string, priceId: string): Promise<ActionResult<Product>> {
  try {
    const [product] = await db
      .update(schema.products)
      .set({ defaultPriceId: priceId, updatedAt: new Date() })
      .where(eq(schema.products.id, productId))
      .returning();

    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    revalidateTag(CACHE_TAGS.products, "max");
    revalidateTag(CACHE_TAGS.product(productId), "max");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error setting default price:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set default price",
    };
  }
}
