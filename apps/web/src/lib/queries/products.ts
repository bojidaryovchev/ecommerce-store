import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { and, asc, desc, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get all active products (for storefront)
 */
export async function getProducts() {
  "use cache";
  cacheTag(CACHE_TAGS.products);

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
}

/**
 * Get all products including inactive (for admin)
 */
export async function getAllProducts() {
  "use cache";
  cacheTag(CACHE_TAGS.products);

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
}

/**
 * Get a single product by ID with all related data
 */
export async function getProductById(id: string) {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.product(id));

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
}

/**
 * Get products by category ID
 */
export async function getProductsByCategoryId(categoryId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.products, CACHE_TAGS.productsByCategory(categoryId));

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
}

/**
 * Get featured/popular products (limited)
 */
export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheTag(CACHE_TAGS.products);

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
}
