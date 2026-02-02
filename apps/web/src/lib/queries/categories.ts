"use server";

import { db, schema } from "@ecommerce/database";
import { asc, eq, isNull } from "drizzle-orm";
import { cache } from "react";

/**
 * Get all categories with optional filtering
 * Cached per-request using React's cache function
 */
export const getCategories = cache(async () => {
  const categories = await db.query.categories.findMany({
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
});

/**
 * Get only root categories (no parent)
 */
export const getRootCategories = cache(async () => {
  const categories = await db.query.categories.findMany({
    where: isNull(schema.categories.parentId),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
  });

  return categories;
});

/**
 * Get a single category by slug with its products
 */
export const getCategoryBySlug = cache(async (slug: string) => {
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.slug, slug),
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
        orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
      },
      parent: true,
    },
  });

  return category;
});

/**
 * Get a single category by ID
 */
export const getCategoryById = cache(async (id: string) => {
  const category = await db.query.categories.findFirst({
    where: eq(schema.categories.id, id),
    with: {
      products: {
        where: eq(schema.products.active, true),
      },
      children: true,
      parent: true,
    },
  });

  return category;
});

/**
 * Get categories with their children (tree structure)
 */
export const getCategoryTree = cache(async () => {
  const categories = await db.query.categories.findMany({
    where: isNull(schema.categories.parentId),
    orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
    with: {
      children: {
        orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
        with: {
          children: {
            orderBy: [asc(schema.categories.sortOrder), asc(schema.categories.name)],
          },
        },
      },
    },
  });

  return categories;
});
