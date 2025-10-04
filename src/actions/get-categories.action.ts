"use server";

import { prisma } from "@/lib/prisma";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    children: number;
    products: number;
  };
};

type GetCategoriesResult = { success: true; data: Category[] } | { success: false; error: string };

export async function getCategories(): Promise<GetCategoriesResult> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    console.error("Error fetching categories:", error);

    return {
      success: false,
      error: "Failed to fetch categories. Please try again.",
    };
  }
}
