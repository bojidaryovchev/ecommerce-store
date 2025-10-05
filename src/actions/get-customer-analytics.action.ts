"use server";

import { getComparisonRange, getCustomerMetrics, getDateRangePreset, type DateRange } from "@/lib/analytics-utils";
import { auth } from "@/lib/auth";

/**
 * Get customer analytics
 */
export async function getCustomerAnalytics(data: { preset?: string; from?: Date; to?: Date; compare?: boolean }) {
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

    // Get current period metrics
    const currentMetrics = await getCustomerMetrics(range);

    // Get comparison data if requested
    let previousMetrics;
    let comparisonRange: DateRange | undefined;

    if (data.compare) {
      comparisonRange = getComparisonRange(range);
      previousMetrics = await getCustomerMetrics(comparisonRange);
    }

    return {
      success: true,
      data: {
        current: currentMetrics,
        previous: previousMetrics,
        range,
        comparisonRange,
      },
    };
  } catch (error) {
    console.error("Get customer analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get customer analytics",
    };
  }
}
