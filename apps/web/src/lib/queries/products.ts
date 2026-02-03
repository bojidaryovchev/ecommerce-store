"use server";

import { db, schema } from "@ecommerce/database";
import { and, asc, desc, eq } from "drizzle-orm";
import { cache } from "react";

/**
 * Get all active products (for storefront)
 */
export const getProducts = cache(async () => {
  const products = await db.query.products.findMany({
    where: eq(schema.products.active, true),
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return products;
});

/**
 * Get all products including inactive (for admin)
 */
export const getAllProducts = cache(async () => {
  const products = await db.query.products.findMany({
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return products;
});

/**
 * Get a single product by ID with all related data
 */
export const getProductById = cache(async (id: string) => {
  const product = await db.query.products.findFirst({
    where: eq(schema.products.id, id),
    with: {
      prices: {
        where: eq(schema.prices.active, true),
        orderBy: [asc(schema.prices.unitAmount)],
      },
      category: true,
      reviews: {
        orderBy: [desc(schema.reviews.createdAt)],
        limit: 10,
      },
    },
  });

  return product;
});

/**
 * Get products by category ID
 */
export const getProductsByCategoryId = cache(async (categoryId: string) => {
  const products = await db.query.products.findMany({
    where: and(eq(schema.products.categoryId, categoryId), eq(schema.products.active, true)),
    orderBy: [desc(schema.products.createdAt)],
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
    },
  });

  return products;
});

/**
 * Get featured/popular products (limited)
 */
export const getFeaturedProducts = cache(async (limit = 8) => {
  const products = await db.query.products.findMany({
    where: eq(schema.products.active, true),
    orderBy: [desc(schema.products.createdAt)],
    limit,
    with: {
      prices: {
        where: eq(schema.prices.active, true),
      },
      category: true,
    },
  });

  return products;
});
