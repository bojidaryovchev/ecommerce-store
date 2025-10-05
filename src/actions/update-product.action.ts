"use server";

import { prisma } from "@/lib/prisma";
import { productSchema, type ProductFormData } from "@/schemas/product.schema";
import { revalidatePath } from "next/cache";

type UpdateProductResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        slug: string;
      };
    }
  | {
      success: false;
      error: string;
    };

/**
 * Server action to update an existing product
 * Validates input, checks for slug/SKU conflicts, and updates product in database
 */
export async function updateProduct(productId: string, formData: ProductFormData): Promise<UpdateProductResult> {
  try {
    // Validate product ID
    if (!productId) {
      return {
        success: false,
        error: "Product ID is required",
      };
    }

    // Validate form data
    const validatedData = productSchema.parse(formData);

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, sku: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    // Check if new slug conflicts with another product
    if (validatedData.slug !== existingProduct.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: validatedData.slug,
          id: { not: productId },
        },
        select: { id: true },
      });

      if (slugConflict) {
        return {
          success: false,
          error: `Another product with slug "${validatedData.slug}" already exists`,
        };
      }
    }

    // Check if new SKU conflicts with another product (if provided)
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          sku: validatedData.sku,
          id: { not: productId },
        },
        select: { id: true },
      });

      if (skuConflict) {
        return {
          success: false,
          error: `Another product with SKU "${validatedData.sku}" already exists`,
        };
      }
    }

    // Verify category exists if provided
    if (validatedData.categoryId) {
      const categoryExists = await prisma.category.findUnique({
        where: { id: validatedData.categoryId },
        select: { id: true },
      });

      if (!categoryExists) {
        return {
          success: false,
          error: "Selected category does not exist",
        };
      }
    }

    // Handle image update
    if (validatedData.image) {
      // Delete existing primary image (position 0) and create new one
      await prisma.productImage.deleteMany({
        where: {
          productId,
          position: 0,
        },
      });

      await prisma.productImage.create({
        data: {
          productId,
          url: validatedData.image,
          alt: validatedData.name,
          position: 0,
        },
      });
    }

    // Update product
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        price: validatedData.price,
        compareAtPrice: validatedData.compareAtPrice,
        costPrice: validatedData.costPrice,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        trackInventory: validatedData.trackInventory,
        stockQuantity: validatedData.stockQuantity,
        lowStockThreshold: validatedData.lowStockThreshold,
        weight: validatedData.weight,
        length: validatedData.length,
        width: validatedData.width,
        height: validatedData.height,
        requiresShipping: validatedData.requiresShipping,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        categoryId: validatedData.categoryId,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    // Revalidate relevant paths
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath(`/products/${product.slug}`);

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error updating product:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while updating the product",
    };
  }
}
