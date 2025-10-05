"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  adjustVariantStockSchema,
  bulkAdjustStockSchema,
  type AdjustVariantStockInput,
  type BulkAdjustStockInput,
} from "@/schemas/product-variant.schema";
import { revalidatePath } from "next/cache";

/**
 * Adjust stock quantity for a single variant
 * Supports incremental adjustments (positive or negative)
 */
export async function adjustVariantStock(data: AdjustVariantStockInput) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!session.user.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validated = adjustVariantStockSchema.parse(data);

    // Get current variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: validated.id },
    });

    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    // Calculate new stock quantity
    const newStockQuantity = variant.stockQuantity + validated.adjustment;

    // Ensure stock doesn't go negative
    if (newStockQuantity < 0) {
      return {
        success: false,
        error: `Cannot reduce stock by ${Math.abs(validated.adjustment)}. Only ${variant.stockQuantity} available.`,
      };
    }

    // Update variant stock
    const updatedVariant = await prisma.productVariant.update({
      where: { id: validated.id },
      data: { stockQuantity: newStockQuantity },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${variant.productId}`);

    return {
      success: true,
      variant: updatedVariant,
      previousStock: variant.stockQuantity,
      newStock: newStockQuantity,
      adjustment: validated.adjustment,
    };
  } catch (error) {
    console.error("Adjust variant stock error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to adjust variant stock" };
  }
}

/**
 * Bulk adjust stock for multiple variants at once
 * Sets absolute stock quantities (not incremental)
 */
export async function bulkAdjustVariantStock(data: BulkAdjustStockInput) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!session.user.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Validate input
    const validated = bulkAdjustStockSchema.parse(data);

    // Verify all variants exist
    const variantIds = validated.adjustments.map((a) => a.id);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
    });

    if (variants.length !== variantIds.length) {
      return {
        success: false,
        error: "One or more variants not found",
      };
    }

    // Update all variants in a transaction
    const updates = await prisma.$transaction(
      validated.adjustments.map((adjustment) =>
        prisma.productVariant.update({
          where: { id: adjustment.id },
          data: { stockQuantity: adjustment.newQuantity },
        }),
      ),
    );

    // Get unique product IDs for revalidation
    const productIds = [...new Set(variants.map((v) => v.productId))];

    revalidatePath("/admin/products");
    productIds.forEach((productId) => {
      revalidatePath(`/admin/products/${productId}`);
    });

    return {
      success: true,
      updatedVariants: updates,
      count: updates.length,
      message: `Successfully updated ${updates.length} variant${updates.length === 1 ? "" : "s"}`,
    };
  } catch (error) {
    console.error("Bulk adjust stock error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to bulk adjust stock" };
  }
}

/**
 * Set variant stock to a specific quantity
 * Wrapper around adjustVariantStock for absolute quantity setting
 */
export async function setVariantStock(variantId: string, newQuantity: number, reason?: string) {
  try {
    // Get current variant
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    // Calculate adjustment needed
    const adjustment = newQuantity - variant.stockQuantity;

    // Use adjustVariantStock to perform the update
    return await adjustVariantStock({
      id: variantId,
      adjustment,
      reason,
    });
  } catch (error) {
    console.error("Set variant stock error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to set variant stock" };
  }
}

/**
 * Get low stock variants for a product or across all products
 * Useful for inventory management dashboard
 */
export async function getLowStockVariants(productId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        ...(productId && { productId }),
        isActive: true,
        stockQuantity: {
          lte: 5, // Consider variants with 5 or less as low stock
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            lowStockThreshold: true,
            images: {
              take: 1,
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: [{ stockQuantity: "asc" }, { product: { name: "asc" } }],
    });

    return {
      success: true,
      variants,
      count: variants.length,
    };
  } catch (error) {
    console.error("Get low stock variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to get low stock variants" };
  }
}

/**
 * Get out of stock variants
 */
export async function getOutOfStockVariants(productId?: string) {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        ...(productId && { productId }),
        isActive: true,
        stockQuantity: 0,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: {
              take: 1,
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: [{ product: { name: "asc" } }],
    });

    return {
      success: true,
      variants,
      count: variants.length,
    };
  } catch (error) {
    console.error("Get out of stock variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to get out of stock variants" };
  }
}
