"use server";

import {
  calculateRevenueOverTime,
  getComparisonRange,
  getDateRangePreset,
  type DateRange,
  type RevenueData,
  type TimeGrouping,
} from "@/lib/analytics-utils";
import { auth } from "@/lib/auth";

/**
 * Get revenue analytics for a date range
 */
export async function getRevenueAnalytics(data: {
  preset?: string;
  from?: Date;
  to?: Date;
  grouping?: TimeGrouping;
  compare?: boolean;
}) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Determine date range
    let range: DateRange;
    if (data.from && data.to) {
      range = { from: data.from, to: data.to };
    } else if (data.preset) {
      range = getDateRangePreset(data.preset);
    } else {
      range = getDateRangePreset("last30days");
    }

    const grouping = data.grouping || "day";

    // Get current period data
    const currentData = await calculateRevenueOverTime(range, grouping);

    // Get comparison data if requested
    let previousData: RevenueData[] | undefined;
    let comparisonRange: DateRange | undefined;

    if (data.compare) {
      comparisonRange = getComparisonRange(range);
      previousData = await calculateRevenueOverTime(comparisonRange, grouping);
    }

    return {
      success: true,
      data: {
        current: currentData,
        previous: previousData,
        range,
        comparisonRange,
      },
    };
  } catch (error) {
    console.error("Get revenue analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get revenue analytics",
    };
  }
}

/**
 * Get revenue summary with comparison
 */
export async function getRevenueSummary(data: { preset?: string; from?: Date; to?: Date }) {
  try {
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Determine date range
    let range: DateRange;
    if (data.from && data.to) {
      range = { from: data.from, to: data.to };
    } else if (data.preset) {
      range = getDateRangePreset(data.preset);
    } else {
      range = getDateRangePreset("last30days");
    }

    // Get current period data
    const currentData = await calculateRevenueOverTime(range, "day");
    const currentTotal = currentData.reduce((sum, d) => sum + d.revenue, 0);
    const currentOrders = currentData.reduce((sum, d) => sum + d.orders, 0);

    // Get comparison period data
    const comparisonRange = getComparisonRange(range);
    const previousData = await calculateRevenueOverTime(comparisonRange, "day");
    const previousTotal = previousData.reduce((sum, d) => sum + d.revenue, 0);
    const previousOrders = previousData.reduce((sum, d) => sum + d.orders, 0);

    // Calculate changes
    const revenueChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    const ordersChange = previousOrders > 0 ? ((currentOrders - previousOrders) / previousOrders) * 100 : 0;

    return {
      success: true,
      data: {
        currentRevenue: currentTotal,
        previousRevenue: previousTotal,
        revenueChange,
        currentOrders,
        previousOrders,
        ordersChange,
        currentAverageOrderValue: currentOrders > 0 ? currentTotal / currentOrders : 0,
        previousAverageOrderValue: previousOrders > 0 ? previousTotal / previousOrders : 0,
      },
    };
  } catch (error) {
    console.error("Get revenue summary error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get revenue summary",
    };
  }
}
