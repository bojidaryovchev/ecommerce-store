"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productVariantSchema, type ProductVariantFormData } from "@/schemas/product-variant.schema";
import { revalidatePath } from "next/cache";

export async function createVariant(data: ProductVariantFormData) {
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
    const validated = productVariantSchema.parse(data);

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: validated.productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Check for duplicate SKU if provided
    if (validated.sku) {
      const existingSku = await prisma.productVariant.findUnique({
        where: { sku: validated.sku },
      });

      if (existingSku) {
        return { success: false, error: "SKU already exists" };
      }
    }

    // Check for duplicate variant options
    if (validated.options) {
      const existingVariants = await prisma.productVariant.findMany({
        where: {
          productId: validated.productId,
        },
      });

      const optionsString = JSON.stringify(validated.options);
      const duplicate = existingVariants.find((v) => JSON.stringify(v.options) === optionsString);

      if (duplicate) {
        return {
          success: false,
          error: "A variant with these options already exists",
        };
      }
    }

    // Create variant
    const variant = await prisma.productVariant.create({
      data: {
        productId: validated.productId,
        name: validated.name,
        sku: validated.sku,
        barcode: validated.barcode,
        price: validated.price,
        stockQuantity: validated.stockQuantity,
        options: validated.options ?? undefined,
        isActive: validated.isActive,
      },
    });

    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);

    return { success: true, variant };
  } catch (error) {
    console.error("Create variant error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to create variant" };
  }
}
