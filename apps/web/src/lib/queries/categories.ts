"use server";

import { db, schema } from "@ecommerce/database";
import { and, asc, eq, isNull } from "drizzle-orm";
import { cache } from "react";

/**
 * Get all categories with optional filtering
 * Cached per-request using React's cache function
 * Excludes soft-deleted categories
 */
export const getCategories = cache(async () => {
  const categories = await db.query.categories.findMany({
    where: isNull(schema.categories.deletedAt),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
});

/**
 * Get only root categories (no parent)
 * Excludes soft-deleted categories
 */
export const getRootCategories = cache(async () => {
  const categories = await db.query.categories.findMany({
    where: and(isNull(schema.categories.parentId), isNull(schema.categories.deletedAt)),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
});

/**
 * Get a single category by slug with its products
 * Excludes soft-deleted categories
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await db.query.categories.findFirst({
    where: and(eq(schema.categories.slug, slug), isNull(schema.categories.deletedAt)),
    with: {
      products: {
        where: eq(schema.products.active, true),
        with: {
          prices: {
            where: eq(schema.prices.active, true),
          },
        },
      },
      children: {
        where: isNull(schema.categories.deletedAt),
        orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
      },
      parent: true,
    },
  });

  return category;
});

/**
 * Get a single category by ID
 * Excludes soft-deleted categories
 */
export const getCategoryById = cache(async (id: string) => {
  const category = await db.query.categories.findFirst({
    where: and(eq(schema.categories.id, id), isNull(schema.categories.deletedAt)),
    with: {
      products: {
        where: eq(schema.products.active, true),
      },
      children: {
        where: isNull(schema.categories.deletedAt),
      },
      parent: true,
    },
  });

  return category;
});

/**
 * Get categories with their children (tree structure)
 * Excludes soft-deleted categories
 */
export const getCategoryTree = cache(async () => {
  const categories = await db.query.categories.findMany({
    where: and(isNull(schema.categories.parentId), isNull(schema.categories.deletedAt)),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
    with: {
      children: {
        where: isNull(schema.categories.deletedAt),
        orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
        with: {
          children: {
            where: isNull(schema.categories.deletedAt),
            orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
          },
        },
      },
    },
  });

  return categories;
});
