"use server";

import { prisma } from "@/lib/prisma";
import { productSchema, type ProductFormData } from "@/schemas/product.schema";
import { revalidatePath } from "next/cache";

type CreateProductResult =
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
 * Server action to create a new product
 * Validates input, checks for slug uniqueness, and creates product in database
 */
export async function createProduct(formData: ProductFormData): Promise<CreateProductResult> {
  try {
    // Validate form data
    const validatedData = productSchema.parse(formData);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validatedData.slug },
      select: { id: true },
    });

    if (existingProduct) {
      return {
        success: false,
        error: `A product with slug "${validatedData.slug}" already exists`,
      };
    }

    // Check if SKU already exists (if provided)
    if (validatedData.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: validatedData.sku },
        select: { id: true },
      });

      if (existingSku) {
        return {
          success: false,
          error: `A product with SKU "${validatedData.sku}" already exists`,
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

    // Create product with image if provided
    const product = await prisma.product.create({
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
        // Create primary image if provided
        ...(validatedData.image && {
          images: {
            create: {
              url: validatedData.image,
              alt: validatedData.name,
              position: 0,
            },
          },
        }),
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

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while creating the product",
    };
  }
}
