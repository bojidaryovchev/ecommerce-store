"use server";

import { prisma } from "@/lib/prisma";
import {
  getAllLowStockItems,
  getCriticalStockItems,
  getLowStockCounts,
  getLowStockProducts,
  getLowStockVariants,
  getOutOfStockItems,
  type LowStockItem,
  type StockMonitorOptions,
} from "@/lib/stock-monitor";

/**
 * Get all low stock items (products and variants)
 */
export async function getLowStockItems(
  options: StockMonitorOptions = {},
): Promise<{ success: boolean; items?: LowStockItem[]; error?: string }> {
  try {
    const items = await getAllLowStockItems(options);
    return { success: true, items };
  } catch (error) {
    console.error("Failed to get low stock items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get low stock items",
    };
  }
}

/**
 * Get low stock products only
 */
export async function getLowStockProductsAction(
  options: StockMonitorOptions = {},
): Promise<{ success: boolean; items?: LowStockItem[]; error?: string }> {
  try {
    const items = await getLowStockProducts(options);
    return { success: true, items };
  } catch (error) {
    console.error("Failed to get low stock products:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get low stock products",
    };
  }
}

/**
 * Get low stock variants only
 */
export async function getLowStockVariantsAction(
  options: StockMonitorOptions = {},
): Promise<{ success: boolean; items?: LowStockItem[]; error?: string }> {
  try {
    const items = await getLowStockVariants(options);
    return { success: true, items };
  } catch (error) {
    console.error("Failed to get low stock variants:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get low stock variants",
    };
  }
}

/**
 * Get counts of low stock items by status
 */
export async function getLowStockCountsAction(options: StockMonitorOptions = {}): Promise<{
  success: boolean;
  counts?: {
    total: number;
    critical: number;
    low: number;
    outOfStock: number;
    byType: { products: number; variants: number };
  };
  error?: string;
}> {
  try {
    const counts = await getLowStockCounts(options);
    return { success: true, counts };
  } catch (error) {
    console.error("Failed to get low stock counts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get low stock counts",
    };
  }
}

/**
 * Get out of stock items only
 */
export async function getOutOfStockItemsAction(
  options: Omit<StockMonitorOptions, "includeOutOfStock"> = {},
): Promise<{ success: boolean; items?: LowStockItem[]; error?: string }> {
  try {
    const items = await getOutOfStockItems(options);
    return { success: true, items };
  } catch (error) {
    console.error("Failed to get out of stock items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get out of stock items",
    };
  }
}

/**
 * Get critical stock items only (quantity <= 1)
 */
export async function getCriticalStockItemsAction(
  options: StockMonitorOptions = {},
): Promise<{ success: boolean; items?: LowStockItem[]; error?: string }> {
  try {
    const items = await getCriticalStockItems(options);
    return { success: true, items };
  } catch (error) {
    console.error("Failed to get critical stock items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get critical stock items",
    };
  }
}

/**
 * Update product stock threshold
 */
export async function updateProductStockThreshold(data: {
  productId: string;
  threshold: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { productId, threshold } = data;

    // Validate threshold
    if (threshold < 0) {
      return { success: false, error: "Threshold must be non-negative" };
    }

    // Update product
    await prisma.product.update({
      where: { id: productId },
      data: { lowStockThreshold: threshold },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to update product stock threshold:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock threshold",
    };
  }
}

/**
 * Bulk update stock thresholds for multiple products
 */
export async function bulkUpdateStockThresholds(data: {
  productIds: string[];
  threshold: number;
}): Promise<{ success: boolean; updated?: number; error?: string }> {
  try {
    const { productIds, threshold } = data;

    // Validate threshold
    if (threshold < 0) {
      return { success: false, error: "Threshold must be non-negative" };
    }

    // Bulk update
    const result = await prisma.product.updateMany({
      where: {
        id: { in: productIds },
      },
      data: {
        lowStockThreshold: threshold,
      },
    });

    return { success: true, updated: result.count };
  } catch (error) {
    console.error("Failed to bulk update stock thresholds:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to bulk update thresholds",
    };
  }
}

/**
 * Get stock alert summary for dashboard
 */
export async function getStockAlertSummary(): Promise<{
  success: boolean;
  summary?: {
    totalLowStock: number;
    criticalItems: number;
    outOfStock: number;
    needsAttention: number;
    recentlyUpdated: LowStockItem[];
  };
  error?: string;
}> {
  try {
    const [counts, allItems] = await Promise.all([
      getLowStockCounts(),
      getAllLowStockItems({ includeOutOfStock: true }),
    ]);

    // Get recently updated items (sorted by last update)
    const recentlyUpdated = allItems.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime()).slice(0, 5);

    const summary = {
      totalLowStock: counts.low,
      criticalItems: counts.critical,
      outOfStock: counts.outOfStock,
      needsAttention: counts.critical + counts.outOfStock,
      recentlyUpdated,
    };

    return { success: true, summary };
  } catch (error) {
    console.error("Failed to get stock alert summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get alert summary",
    };
  }
}
