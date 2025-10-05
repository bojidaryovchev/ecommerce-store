import type { Product, WishlistItem } from "@prisma/client";

/**
 * Wishlist item with product details
 */
export type WishlistItemWithProduct = WishlistItem & {
  product: Product & {
    images: { url: string; alt: string | null }[];
  };
};

/**
 * Sort wishlist items
 */
export function sortWishlistItems(
  items: WishlistItemWithProduct[],
  sortBy: "newest" | "oldest" | "name" | "price-asc" | "price-desc" = "newest",
): WishlistItemWithProduct[] {
  const sorted = [...items];

  switch (sortBy) {
    case "newest":
      return sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    case "oldest":
      return sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    case "name":
      return sorted.sort((a, b) => a.product.name.localeCompare(b.product.name));
    case "price-asc":
      return sorted.sort((a, b) => Number(a.product.price) - Number(b.product.price));
    case "price-desc":
      return sorted.sort((a, b) => Number(b.product.price) - Number(a.product.price));
    default:
      return sorted;
  }
}

/**
 * Filter wishlist items
 */
export function filterWishlistItems(
  items: WishlistItemWithProduct[],
  filters: {
    inStock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
  },
): WishlistItemWithProduct[] {
  let filtered = [...items];

  // Filter by stock
  if (filters.inStock) {
    filtered = filtered.filter((item) => item.product.stockQuantity > 0);
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((item) => Number(item.product.price) >= filters.minPrice!);
  }
  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((item) => Number(item.product.price) <= filters.maxPrice!);
  }

  // Filter by search query
  if (filters.search) {
    const query = filters.search.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.product.name.toLowerCase().includes(query) || item.product.description?.toLowerCase().includes(query),
    );
  }

  return filtered;
}

/**
 * Calculate wishlist statistics
 */
export function calculateWishlistStats(items: WishlistItemWithProduct[]) {
  const totalItems = items.length;
  const inStockItems = items.filter((item) => item.product.stockQuantity > 0).length;
  const outOfStockItems = totalItems - inStockItems;

  const totalValue = items.reduce((sum, item) => {
    return sum + Number(item.product.price);
  }, 0);

  const averagePrice = totalItems > 0 ? totalValue / totalItems : 0;

  return {
    totalItems,
    inStockItems,
    outOfStockItems,
    totalValue,
    averagePrice,
  };
}

/**
 * Format wishlist summary for display
 */
export function formatWishlistSummary(items: WishlistItemWithProduct[]): string {
  const stats = calculateWishlistStats(items);

  if (stats.totalItems === 0) {
    return "Your wishlist is empty";
  }

  const itemText = stats.totalItems === 1 ? "item" : "items";
  return `${stats.totalItems} ${itemText} in wishlist`;
}

/**
 * Check if product is available (in stock and active)
 */
export function isProductAvailable(product: Product): boolean {
  return product.isActive && product.stockQuantity > 0;
}

/**
 * Get product availability message
 */
export function getAvailabilityMessage(product: Product): string {
  if (!product.isActive) {
    return "Product unavailable";
  }
  if (product.stockQuantity === 0) {
    return "Out of stock";
  }
  if (product.stockQuantity < 5) {
    return `Only ${product.stockQuantity} left`;
  }
  return "In stock";
}
