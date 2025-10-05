"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVariantCombinations, generateVariantName, generateVariantSku } from "@/lib/variant-utils";
import { bulkGenerateVariantsSchema, type BulkGenerateVariantsInput } from "@/schemas/product-variant.schema";
import { revalidatePath } from "next/cache";

/**
 * Generate multiple variants from option combinations
 * Example: Size: [S, M, L], Color: [Red, Blue] => 6 variants
 */
export async function generateVariants(data: BulkGenerateVariantsInput) {
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
    const validated = bulkGenerateVariantsSchema.parse(data);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Generate all combinations
    const combinations = generateVariantCombinations(validated.optionTypes);

    if (combinations.length === 0) {
      return { success: false, error: "No combinations generated" };
    }

    // Check if this would create too many variants
    if (combinations.length > 100) {
      return {
        success: false,
        error: `Too many combinations (${combinations.length}). Maximum is 100.`,
      };
    }

    // Check for duplicate combinations with existing variants
    const existingVariantsOptions = product.variants.map((v) => JSON.stringify(v.options));
    const newCombinationsFiltered = combinations.filter(
      (combo) => !existingVariantsOptions.includes(JSON.stringify(combo)),
    );

    if (newCombinationsFiltered.length === 0) {
      return {
        success: false,
        error: "All variant combinations already exist for this product",
      };
    }

    // Prepare variants data
    const variantsToCreate = newCombinationsFiltered.map((options) => {
      const name = generateVariantName(options);
      let sku = null;

      if (validated.autoGenerateSku) {
        sku = generateVariantSku(product.sku, options, validated.skuPattern);
      }

      return {
        productId: validated.productId,
        name,
        sku,
        options,
        price: validated.basePrice,
        stockQuantity: validated.baseStockQuantity,
        isActive: true,
      };
    });

    // Check for SKU conflicts if auto-generating
    if (validated.autoGenerateSku) {
      const skus = variantsToCreate.map((v) => v.sku).filter((sku): sku is string => sku !== null);

      if (skus.length > 0) {
        const existingSkus = await prisma.productVariant.findMany({
          where: {
            sku: { in: skus },
          },
          select: { sku: true },
        });

        if (existingSkus.length > 0) {
          const conflictingSkus = existingSkus.map((v) => v.sku).join(", ");
          return {
            success: false,
            error: `The following SKUs already exist: ${conflictingSkus}. Please use a different SKU pattern or disable auto-generation.`,
          };
        }
      }
    }

    // Create all variants in a transaction
    const createdVariants = await prisma.$transaction(
      variantsToCreate.map((variant) =>
        prisma.productVariant.create({
          data: {
            productId: variant.productId,
            name: variant.name,
            sku: variant.sku,
            options: variant.options,
            price: variant.price,
            stockQuantity: variant.stockQuantity,
            isActive: variant.isActive,
          },
        }),
      ),
    );

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${validated.productId}`);

    return {
      success: true,
      variants: createdVariants,
      count: createdVariants.length,
      message: `Successfully created ${createdVariants.length} variant${createdVariants.length === 1 ? "" : "s"}`,
    };
  } catch (error) {
    console.error("Generate variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to generate variants" };
  }
}

/**
 * Preview variant combinations without creating them
 * Useful for showing what will be created before confirming
 */
export async function previewVariantCombinations(data: BulkGenerateVariantsInput) {
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
    const validated = bulkGenerateVariantsSchema.parse(data);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Generate all combinations
    const combinations = generateVariantCombinations(validated.optionTypes);

    if (combinations.length === 0) {
      return { success: false, error: "No combinations generated" };
    }

    // Check if this would create too many variants
    if (combinations.length > 100) {
      return {
        success: false,
        error: `Too many combinations (${combinations.length}). Maximum is 100.`,
      };
    }

    // Check which combinations already exist
    const existingVariantsOptions = new Set(product.variants.map((v) => JSON.stringify(v.options)));

    const preview = combinations.map((options) => {
      const name = generateVariantName(options);
      const sku = validated.autoGenerateSku ? generateVariantSku(product.sku, options, validated.skuPattern) : null;
      const alreadyExists = existingVariantsOptions.has(JSON.stringify(options));

      return {
        name,
        sku,
        options,
        price: validated.basePrice,
        stockQuantity: validated.baseStockQuantity,
        alreadyExists,
      };
    });

    const newCount = preview.filter((p) => !p.alreadyExists).length;
    const existingCount = preview.filter((p) => p.alreadyExists).length;

    return {
      success: true,
      preview,
      totalCombinations: combinations.length,
      newVariants: newCount,
      existingVariants: existingCount,
      message:
        newCount > 0
          ? `Will create ${newCount} new variant${newCount === 1 ? "" : "s"}${
              existingCount > 0 ? ` (${existingCount} already exist${existingCount === 1 ? "s" : ""})` : ""
            }`
          : "All combinations already exist",
    };
  } catch (error) {
    console.error("Preview variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to preview variants" };
  }
}

/**
 * Delete all variants for a product (admin only, careful!)
 * Useful for starting over with variant generation
 */
export async function deleteAllVariants(productId: string) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!session.user.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          include: {
            orderItems: true,
            cartItems: true,
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check if any variants have been ordered
    const hasOrders = product.variants.some((v) => v.orderItems.length > 0);
    if (hasOrders) {
      return {
        success: false,
        error: "Cannot delete variants that have been ordered. Consider deactivating them instead.",
      };
    }

    // Remove from carts first
    const cartItemsToDelete = product.variants.flatMap((v) => v.cartItems.map((ci) => ci.id));
    if (cartItemsToDelete.length > 0) {
      await prisma.cartItem.deleteMany({
        where: { id: { in: cartItemsToDelete } },
      });
    }

    // Delete all variants
    const result = await prisma.productVariant.deleteMany({
      where: { productId },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      count: result.count,
      message: `Deleted ${result.count} variant${result.count === 1 ? "" : "s"}`,
    };
  } catch (error) {
    console.error("Delete all variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to delete variants" };
  }
}
