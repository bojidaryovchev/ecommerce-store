"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateVariantSchema, type UpdateVariantInput } from "@/schemas/product-variant.schema";
import { revalidatePath } from "next/cache";

export async function updateVariant(data: UpdateVariantInput) {
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
    const validated = updateVariantSchema.parse(data);

    // Check if variant exists
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: validated.id },
      include: { product: true },
    });

    if (!existingVariant) {
      return { success: false, error: "Variant not found" };
    }

    // Check for duplicate SKU if updating
    if (validated.sku && validated.sku !== existingVariant.sku) {
      const skuExists = await prisma.productVariant.findUnique({
        where: { sku: validated.sku },
      });

      if (skuExists) {
        return { success: false, error: "SKU already exists" };
      }
    }

    // Check for duplicate variant options if updating
    if (validated.options) {
      const siblingVariants = await prisma.productVariant.findMany({
        where: {
          productId: existingVariant.productId,
          id: { not: validated.id },
        },
      });

      const optionsString = JSON.stringify(validated.options);
      const duplicate = siblingVariants.find((v) => JSON.stringify(v.options) === optionsString);

      if (duplicate) {
        return {
          success: false,
          error: "A variant with these options already exists",
        };
      }
    }

    // Update variant
    const variant = await prisma.productVariant.update({
      where: { id: validated.id },
      data: {
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
    revalidatePath(`/admin/products/${existingVariant.productId}`);

    return { success: true, variant };
  } catch (error) {
    console.error("Update variant error:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update variant" };
  }
}
