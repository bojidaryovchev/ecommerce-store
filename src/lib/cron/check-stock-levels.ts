"use server";

/**
 * Automated Stock Level Check - Cron Job
 *
 * This module provides scheduled stock monitoring functionality that can be triggered by:
 * - Server-side cron jobs (e.g., node-cron, cron-job.org)
 * - Serverless functions (e.g., Vercel Cron, AWS Lambda)
 * - API routes with scheduled triggers
 *
 * Usage Examples:
 *
 * 1. Next.js API Route (app/api/cron/check-stock/route.ts):
 *    ```typescript
 *    export async function GET(request: Request) {
 *      const authHeader = request.headers.get('authorization');
 *      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 *        return new Response('Unauthorized', { status: 401 });
 *      }
 *      await checkStockLevels();
 *      return Response.json({ success: true });
 *    }
 *    ```
 *
 * 2. Vercel Cron (vercel.json):
 *    ```json
 *    {
 *      "crons": [{
 *        "path": "/api/cron/check-stock",
 *        "schedule": "0 * * * *"
 *      }]
 *    }
 *    ```
 *
 * 3. Node Cron (server.ts):
 *    ```typescript
 *    import cron from 'node-cron';
 *    import { checkStockLevels } from '@/lib/cron/check-stock-levels';
 *
 *    // Run every hour
 *    cron.schedule('0 * * * *', () => {
 *      checkStockLevels();
 *    });
 *    ```
 */

import {
  sendConsolidatedStockAlert,
  sendCriticalStockAlert,
  sendLowStockAlert,
  sendOutOfStockAlert,
} from "@/lib/email-notifications";
import { getAllLowStockItems, getCriticalStockItems, getLowStockCounts, getOutOfStockItems } from "@/lib/stock-monitor";

/**
 * Configuration for stock check behavior
 */
export interface StockCheckConfig {
  /**
   * Whether to send email alerts
   */
  sendAlerts?: boolean;

  /**
   * Whether to send consolidated alert (one email with all categories)
   * or separate alerts by severity (recommended)
   */
  consolidate?: boolean;

  /**
   * Minimum items required to trigger an alert
   * Set to 0 to always send (even if no issues)
   */
  minItemsForAlert?: number;

  /**
   * Whether to include inactive products in the check
   */
  includeInactive?: boolean;

  /**
   * Override default recipient emails
   */
  recipientEmails?: string[];

  /**
   * Dry run mode - log what would be sent without sending
   */
  dryRun?: boolean;
}

/**
 * Result of a stock check operation
 */
export interface StockCheckResult {
  success: boolean;
  timestamp: Date;
  counts: {
    total: number;
    critical: number;
    low: number;
    outOfStock: number;
  };
  alertsSent: number;
  errors: string[];
}

/**
 * Main function to check all stock levels and send alerts
 *
 * This function:
 * 1. Queries all low stock items from database
 * 2. Categorizes them by severity (critical, out-of-stock, low)
 * 3. Sends appropriate email alerts
 * 4. Returns detailed results for logging
 *
 * @param config - Optional configuration for the check
 * @returns Promise<StockCheckResult> - Results of the check operation
 */
export async function checkStockLevels(config: StockCheckConfig = {}): Promise<StockCheckResult> {
  const {
    sendAlerts = true,
    consolidate = false,
    minItemsForAlert = 1,
    includeInactive = false,
    recipientEmails,
    dryRun = false,
  } = config;

  const result: StockCheckResult = {
    success: true,
    timestamp: new Date(),
    counts: {
      total: 0,
      critical: 0,
      low: 0,
      outOfStock: 0,
    },
    alertsSent: 0,
    errors: [],
  };

  try {
    console.log(`[Stock Check] Starting stock level check at ${result.timestamp.toISOString()}`);

    // Get all low stock items
    const allItems = await getAllLowStockItems({
      includeOutOfStock: true,
      includeInactive,
    });

    // Get counts by category
    const counts = await getLowStockCounts();
    result.counts = {
      total: allItems.length,
      critical: counts.critical,
      low: counts.low,
      outOfStock: counts.outOfStock,
    };

    console.log(`[Stock Check] Found ${result.counts.total} items needing attention:`);
    console.log(`  - Critical: ${result.counts.critical}`);
    console.log(`  - Low Stock: ${result.counts.low}`);
    console.log(`  - Out of Stock: ${result.counts.outOfStock}`);

    // Check if we should send alerts
    if (!sendAlerts) {
      console.log("[Stock Check] Alerts disabled, skipping email notifications");
      return result;
    }

    if (result.counts.total < minItemsForAlert) {
      console.log(
        `[Stock Check] Total items (${result.counts.total}) below minimum threshold (${minItemsForAlert}), skipping alerts`,
      );
      return result;
    }

    // Get items by category for separate alerts
    const criticalItems = await getCriticalStockItems();
    const outOfStockItems = await getOutOfStockItems();
    const lowStockItems = allItems.filter((item) => item.status === "low-stock");

    // Prepare email options
    const emailOptions = recipientEmails ? { recipientEmail: recipientEmails } : undefined;

    if (dryRun) {
      console.log("[Stock Check] DRY RUN - Would send the following alerts:");
      if (consolidate) {
        console.log(
          `  - Consolidated alert with ${result.counts.total} items to ${recipientEmails?.join(", ") || "default recipients"}`,
        );
      } else {
        if (criticalItems.length > 0) {
          console.log(`  - Critical alert for ${criticalItems.length} items`);
        }
        if (outOfStockItems.length > 0) {
          console.log(`  - Out of stock alert for ${outOfStockItems.length} items`);
        }
        if (lowStockItems.length > 0) {
          console.log(`  - Low stock alert for ${lowStockItems.length} items`);
        }
      }
      return result;
    }

    // Send alerts
    if (consolidate) {
      // Send one consolidated email with all categories
      console.log("[Stock Check] Sending consolidated stock alert...");
      const alertResult = await sendConsolidatedStockAlert(lowStockItems, criticalItems, outOfStockItems, emailOptions);

      if (alertResult.success) {
        result.alertsSent = 1;
        console.log("[Stock Check] Consolidated alert sent successfully");
      } else {
        result.errors.push(`Consolidated alert failed: ${alertResult.error}`);
        result.success = false;
      }
    } else {
      // Send separate alerts by severity (recommended)
      const alertPromises: Promise<{ success: boolean; error?: string }>[] = [];

      if (criticalItems.length > 0) {
        console.log(`[Stock Check] Sending critical alert for ${criticalItems.length} items...`);
        alertPromises.push(sendCriticalStockAlert(criticalItems, emailOptions));
      }

      if (outOfStockItems.length > 0) {
        console.log(`[Stock Check] Sending out of stock alert for ${outOfStockItems.length} items...`);
        alertPromises.push(sendOutOfStockAlert(outOfStockItems, emailOptions));
      }

      if (lowStockItems.length > 0) {
        console.log(`[Stock Check] Sending low stock alert for ${lowStockItems.length} items...`);
        alertPromises.push(sendLowStockAlert(lowStockItems, emailOptions));
      }

      // Wait for all alerts to complete
      const results = await Promise.all(alertPromises);

      // Process results
      results.forEach((alertResult, index) => {
        if (alertResult.success) {
          result.alertsSent++;
        } else {
          result.errors.push(`Alert ${index + 1} failed: ${alertResult.error}`);
          result.success = false;
        }
      });

      console.log(`[Stock Check] Sent ${result.alertsSent} alerts successfully`);
    }

    if (result.errors.length > 0) {
      console.error("[Stock Check] Errors encountered:", result.errors);
    }

    return result;
  } catch (error) {
    console.error("[Stock Check] Fatal error during stock check:", error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
    return result;
  }
}

/**
 * Quick check function for API routes
 * Returns a simplified result suitable for HTTP responses
 */
export async function performStockCheck(): Promise<{
  success: boolean;
  message: string;
  data?: StockCheckResult;
}> {
  try {
    const result = await checkStockLevels();
    return {
      success: result.success,
      message: result.success
        ? `Stock check completed. ${result.alertsSent} alert(s) sent.`
        : "Stock check completed with errors",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Stock check failed",
    };
  }
}

/**
 * Health check function to verify the cron job system is working
 * Can be used for monitoring and alerting
 */
export async function healthCheck(): Promise<{
  healthy: boolean;
  lastCheck?: Date;
  itemsMonitored: number;
}> {
  try {
    const counts = await getLowStockCounts();
    const total = counts.critical + counts.low + counts.outOfStock;

    return {
      healthy: true,
      lastCheck: new Date(),
      itemsMonitored: total,
    };
  } catch (error) {
    console.error("[Stock Check] Health check failed:", error);
    return {
      healthy: false,
      itemsMonitored: 0,
    };
  }
}

/**
 * Get stock check status and statistics
 * Useful for admin dashboards and monitoring
 */
export async function getStockCheckStatus(): Promise<{
  currentStatus: {
    total: number;
    critical: number;
    low: number;
    outOfStock: number;
  };
  needsAttention: boolean;
  lastChecked: Date;
}> {
  const counts = await getLowStockCounts();
  const total = counts.critical + counts.low + counts.outOfStock;

  return {
    currentStatus: {
      total,
      critical: counts.critical,
      low: counts.low,
      outOfStock: counts.outOfStock,
    },
    needsAttention: counts.critical > 0 || counts.outOfStock > 0,
    lastChecked: new Date(),
  };
}
