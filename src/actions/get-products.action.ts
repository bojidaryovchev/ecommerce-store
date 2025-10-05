"use server";

import { prisma } from "@/lib/prisma";

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  categoryId: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    url: string;
    alt: string | null;
    position: number;
  }[];
  _count: {
    reviews: number;
    orderItems: number;
  };
  createdAt: Date;
  updatedAt: Date;
};

type GetProductsResult =
  | {
      success: true;
      data: Product[];
    }
  | {
      success: false;
      error: string;
    };

export type GetProductsOptions = {
  categoryId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  searchQuery?: string;
};

/**
 * Server action to fetch all products with their category and image info
 * Supports filtering by category, active status, and featured status
 */
export async function getProducts(options: GetProductsOptions = {}): Promise<GetProductsResult> {
  try {
    const { categoryId, isActive, isFeatured, searchQuery } = options;

    const products = await prisma.product.findMany({
      where: {
        ...(categoryId && { categoryId }),
        ...(isActive !== undefined && { isActive }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(searchQuery && {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" } },
            { description: { contains: searchQuery, mode: "insensitive" } },
            { sku: { contains: searchQuery, mode: "insensitive" } },
          ],
        }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        compareAtPrice: true,
        stockQuantity: true,
        isActive: true,
        isFeatured: true,
        categoryId: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            position: true,
          },
          orderBy: {
            position: "asc",
          },
          take: 1, // Only get the first image for list view
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    });

    // Convert Decimal to number for serialization
    const serializedProducts = products.map((product) => ({
      ...product,
      price: product.price.toNumber(),
      compareAtPrice: product.compareAtPrice?.toNumber() ?? null,
    }));

    return {
      success: true,
      data: serializedProducts,
    };
  } catch (error) {
    console.error("Error fetching products:", error);

    return {
      success: false,
      error: "Failed to fetch products",
    };
  }
}
