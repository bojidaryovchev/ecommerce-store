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

  // Coupons
  coupons: "coupons",
  coupon: (id: string) => `coupon:${id}`,

  // Promotion Codes
  promotionCodes: "promotion-codes",

  // Checkout Sessions
  checkoutSession: (sessionId: string) => `checkout-session:${sessionId}`,

  // Refunds
  refundsByOrder: (orderId: string) => `refunds-order:${orderId}`,

  // Cart is user-specific and changes frequently - no caching
  // Wishlists are also uncached — user-specific, frequent changes, always fetched with auth()
} as const;
