"use server";

import type { ActionResult } from "@/types/action-result.type";
import type { Price, Product } from "@ecommerce/database";
import { db, insertProductSchema, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Create a new product
 */
export async function createProduct(
  data: Omit<typeof schema.products.$inferInsert, "id" | "createdAt" | "updatedAt" | "created">,
): Promise<ActionResult<Product>> {
  try {
    const validated = insertProductSchema.parse(data);

    const [product] = await db.insert(schema.products).values(validated).returning();

    revalidatePath("/products");
    revalidatePath("/admin/products");
    revalidatePath("/");

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

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${id}`);
    revalidatePath("/");

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

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/");

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

    revalidatePath("/products");
    revalidatePath(`/products/${id}`);
    revalidatePath("/admin/products");
    revalidatePath("/");

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

    revalidatePath("/products");
    revalidatePath(`/products/${data.productId}`);
    revalidatePath("/admin/products");

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

    revalidatePath("/products");
    revalidatePath(`/products/${price.productId}`);
    revalidatePath("/admin/products");

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

    revalidatePath("/products");
    revalidatePath(`/products/${price.productId}`);
    revalidatePath("/admin/products");

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

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    revalidatePath("/admin/products");

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
