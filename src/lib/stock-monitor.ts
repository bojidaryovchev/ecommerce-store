/**
 * Stock Monitoring Service
 * Provides utilities for monitoring inventory levels and detecting low stock situations
 */

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Stock status levels
 */
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock" | "critical";

/**
 * Low stock item with product and variant information
 */
export interface LowStockItem {
  type: "product" | "variant";
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  variantName?: string;
  sku?: string;
  stockQuantity: number;
  threshold: number;
  status: StockStatus;
  lastUpdated: Date;
}

/**
 * Stock monitoring options
 */
export interface StockMonitorOptions {
  threshold?: number; // Default threshold if product doesn't have one
  includeInactive?: boolean; // Include inactive products/variants
  includeOutOfStock?: boolean; // Include out of stock items
}

/**
 * Default stock monitoring configuration
 */
const DEFAULT_THRESHOLD = 5;
const CRITICAL_THRESHOLD = 1;

/**
 * Determine stock status based on quantity and threshold
 */
export function getStockStatus(quantity: number, threshold: number = DEFAULT_THRESHOLD): StockStatus {
  if (quantity === 0) return "out-of-stock";
  if (quantity <= CRITICAL_THRESHOLD) return "critical";
  if (quantity <= threshold) return "low-stock";
  return "in-stock";
}

/**
 * Check if stock quantity is below threshold
 */
export function isStockLow(quantity: number, threshold: number = DEFAULT_THRESHOLD): boolean {
  return quantity <= threshold && quantity > 0;
}

/**
 * Check if stock is critically low
 */
export function isStockCritical(quantity: number): boolean {
  return quantity <= CRITICAL_THRESHOLD && quantity > 0;
}

/**
 * Check if product/variant is out of stock
 */
export function isOutOfStock(quantity: number): boolean {
  return quantity === 0;
}

/**
 * Get all products with low stock
 */
export async function getLowStockProducts(options: StockMonitorOptions = {}): Promise<LowStockItem[]> {
  const { threshold = DEFAULT_THRESHOLD, includeInactive = false, includeOutOfStock = false } = options;

  // Build where clause
  const where: Prisma.ProductWhereInput = {
    trackInventory: true,
    ...(includeInactive ? {} : { isActive: true }),
  };

  // Fetch products
  const products = await prisma.product.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      stockQuantity: true,
      lowStockThreshold: true,
      isActive: true,
      updatedAt: true,
    },
    orderBy: {
      stockQuantity: "asc",
    },
  });

  // Filter and map to LowStockItem
  const lowStockItems: LowStockItem[] = products
    .filter((product) => {
      const productThreshold = product.lowStockThreshold || threshold;
      const quantity = product.stockQuantity;

      if (includeOutOfStock) {
        return quantity <= productThreshold;
      }
      return quantity > 0 && quantity <= productThreshold;
    })
    .map((product) => ({
      type: "product" as const,
      id: product.id,
      productId: product.id,
      productName: product.name,
      productSlug: product.slug,
      sku: product.sku || undefined,
      stockQuantity: product.stockQuantity,
      threshold: product.lowStockThreshold || threshold,
      status: getStockStatus(product.stockQuantity, product.lowStockThreshold || threshold),
      lastUpdated: product.updatedAt,
    }));

  return lowStockItems;
}

/**
 * Get all variants with low stock
 */
export async function getLowStockVariants(options: StockMonitorOptions = {}): Promise<LowStockItem[]> {
  const { threshold = DEFAULT_THRESHOLD, includeInactive = false, includeOutOfStock = false } = options;

  // Build where clause
  const where: Prisma.ProductVariantWhereInput = {
    ...(includeInactive ? {} : { isActive: true }),
    product: {
      trackInventory: true,
      ...(includeInactive ? {} : { isActive: true }),
    },
  };

  // Fetch variants
  const variants = await prisma.productVariant.findMany({
    where,
    select: {
      id: true,
      name: true,
      sku: true,
      stockQuantity: true,
      isActive: true,
      updatedAt: true,
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          lowStockThreshold: true,
        },
      },
    },
    orderBy: {
      stockQuantity: "asc",
    },
  });

  // Filter and map to LowStockItem
  const lowStockItems: LowStockItem[] = variants
    .filter((variant) => {
      const variantThreshold = variant.product.lowStockThreshold || threshold;
      const quantity = variant.stockQuantity;

      if (includeOutOfStock) {
        return quantity <= variantThreshold;
      }
      return quantity > 0 && quantity <= variantThreshold;
    })
    .map((variant) => ({
      type: "variant" as const,
      id: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      productSlug: variant.product.slug,
      variantId: variant.id,
      variantName: variant.name,
      sku: variant.sku || undefined,
      stockQuantity: variant.stockQuantity,
      threshold: variant.product.lowStockThreshold || threshold,
      status: getStockStatus(variant.stockQuantity, variant.product.lowStockThreshold || threshold),
      lastUpdated: variant.updatedAt,
    }));

  return lowStockItems;
}

/**
 * Get all low stock items (products and variants combined)
 */
export async function getAllLowStockItems(options: StockMonitorOptions = {}): Promise<LowStockItem[]> {
  const [products, variants] = await Promise.all([getLowStockProducts(options), getLowStockVariants(options)]);

  // Combine and sort by stock quantity (lowest first)
  return [...products, ...variants].sort((a, b) => a.stockQuantity - b.stockQuantity);
}

/**
 * Get count of low stock items by status
 */
export async function getLowStockCounts(options: StockMonitorOptions = {}): Promise<{
  total: number;
  critical: number;
  low: number;
  outOfStock: number;
  byType: {
    products: number;
    variants: number;
  };
}> {
  const items = await getAllLowStockItems({ ...options, includeOutOfStock: true });

  const counts = {
    total: items.length,
    critical: items.filter((item) => item.status === "critical").length,
    low: items.filter((item) => item.status === "low-stock").length,
    outOfStock: items.filter((item) => item.status === "out-of-stock").length,
    byType: {
      products: items.filter((item) => item.type === "product").length,
      variants: items.filter((item) => item.type === "variant").length,
    },
  };

  return counts;
}

/**
 * Get out of stock items only
 */
export async function getOutOfStockItems(
  options: Omit<StockMonitorOptions, "includeOutOfStock"> = {},
): Promise<LowStockItem[]> {
  const items = await getAllLowStockItems({ ...options, includeOutOfStock: true });
  return items.filter((item) => item.status === "out-of-stock");
}

/**
 * Get critical stock items only (quantity <= 1)
 */
export async function getCriticalStockItems(options: StockMonitorOptions = {}): Promise<LowStockItem[]> {
  const items = await getAllLowStockItems(options);
  return items.filter((item) => item.status === "critical");
}

/**
 * Check if a specific product needs restocking
 */
export async function checkProductNeedsRestock(productId: string): Promise<{
  needsRestock: boolean;
  status: StockStatus;
  stockQuantity: number;
  threshold: number;
}> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      stockQuantity: true,
      lowStockThreshold: true,
      trackInventory: true,
    },
  });

  if (!product || !product.trackInventory) {
    return {
      needsRestock: false,
      status: "in-stock",
      stockQuantity: product?.stockQuantity || 0,
      threshold: product?.lowStockThreshold || DEFAULT_THRESHOLD,
    };
  }

  const threshold = product.lowStockThreshold || DEFAULT_THRESHOLD;
  const status = getStockStatus(product.stockQuantity, threshold);
  const needsRestock = product.stockQuantity <= threshold;

  return {
    needsRestock,
    status,
    stockQuantity: product.stockQuantity,
    threshold,
  };
}

/**
 * Check if a specific variant needs restocking
 */
export async function checkVariantNeedsRestock(variantId: string): Promise<{
  needsRestock: boolean;
  status: StockStatus;
  stockQuantity: number;
  threshold: number;
}> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: {
        select: {
          lowStockThreshold: true,
          trackInventory: true,
        },
      },
    },
  });

  if (!variant || !variant.product.trackInventory) {
    return {
      needsRestock: false,
      status: "in-stock",
      stockQuantity: variant?.stockQuantity || 0,
      threshold: variant?.product.lowStockThreshold || DEFAULT_THRESHOLD,
    };
  }

  const threshold = variant.product.lowStockThreshold || DEFAULT_THRESHOLD;
  const status = getStockStatus(variant.stockQuantity, threshold);
  const needsRestock = variant.stockQuantity <= threshold;

  return {
    needsRestock,
    status,
    stockQuantity: variant.stockQuantity,
    threshold,
  };
}

/**
 * Get stock status color for UI display
 */
export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case "in-stock":
      return "text-green-600 bg-green-100";
    case "low-stock":
      return "text-yellow-600 bg-yellow-100";
    case "critical":
      return "text-orange-600 bg-orange-100";
    case "out-of-stock":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

/**
 * Get stock status label for UI display
 */
export function getStockStatusLabel(status: StockStatus): string {
  switch (status) {
    case "in-stock":
      return "In Stock";
    case "low-stock":
      return "Low Stock";
    case "critical":
      return "Critical";
    case "out-of-stock":
      return "Out of Stock";
    default:
      return "Unknown";
  }
}

/**
 * Format stock alert message
 */
export function formatStockAlertMessage(item: LowStockItem): string {
  const itemName = item.variantName ? `${item.productName} - ${item.variantName}` : item.productName;

  const sku = item.sku ? ` (SKU: ${item.sku})` : "";

  return `${itemName}${sku} is ${item.status === "out-of-stock" ? "out of stock" : `low on stock (${item.stockQuantity} remaining)`}`;
}
