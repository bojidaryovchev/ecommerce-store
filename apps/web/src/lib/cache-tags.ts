/**
 * Cache tag constants for consistent cache invalidation
 * Use these with cacheTag() in queries and revalidateTag() in actions
 */

export const CACHE_TAGS = {
  // Categories
  categories: "categories",
  category: (id: string) => `category:${id}`,
  categoryBySlug: (slug: string) => `category-slug:${slug}`,

  // Products
  products: "products",
  product: (id: string) => `product:${id}`,
  productsByCategory: (categoryId: string) => `products-category:${categoryId}`,

  // Orders (user-specific, use sparingly)
  orders: "orders",
  ordersByUser: (userId: string) => `orders-user:${userId}`,
  order: (id: string) => `order:${id}`,

  // Addresses
  addresses: (userId: string) => `addresses:${userId}`,

  // Reviews
  reviews: "reviews",
  reviewsByProduct: (productId: string) => `reviews-product:${productId}`,

  // Cart is user-specific and changes frequently - no caching
} as const;
