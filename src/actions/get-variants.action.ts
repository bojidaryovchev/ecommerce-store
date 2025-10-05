"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVariantsSchema, type GetVariantsInput } from "@/schemas/product-variant.schema";

export async function getVariants(data: GetVariantsInput) {
  try {
    // Validate input
    const validated = getVariantsSchema.parse(data);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Get variants
    const variants = await prisma.productVariant.findMany({
      where: {
        productId: validated.productId,
        ...(validated.includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return { success: true, variants };
  } catch (error) {
    console.error("Get variants error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to get variants" };
  }
}

/**
 * Get a single variant by ID (for public access)
 */
export async function getVariantById(variantId: string) {
  try {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          include: {
            images: true,
            category: true,
          },
        },
      },
    });

    if (!variant) {
      return { success: false, error: "Variant not found" };
    }

    // Only return active variants to public
    if (!variant.isActive) {
      const session = await auth();
      if (!session?.user?.roles?.includes("ADMIN")) {
        return { success: false, error: "Variant not available" };
      }
    }

    return { success: true, variant };
  } catch (error) {
    console.error("Get variant by ID error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to get variant" };
  }
}

/**
 * Get variants with stock and cart information (for admin)
 */
export async function getVariantsWithDetails(productId: string) {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Insufficient permissions" };
    }

    const variants = await prisma.productVariant.findMany({
      where: { productId },
      include: {
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
          },
        },
      },
      orderBy: [{ createdAt: "asc" }],
    });

    return { success: true, variants };
  } catch (error) {
    console.error("Get variants with details error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to get variants" };
  }
}
