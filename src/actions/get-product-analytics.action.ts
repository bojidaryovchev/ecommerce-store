"use server";

import { getDateRangePreset, getTopProducts, type DateRange } from "@/lib/analytics-utils";
import { auth } from "@/lib/auth";

/**
 * Get product performance analytics
 */
export async function getProductAnalytics(data: {
  preset?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  sortBy?: "revenue" | "units";
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

    const limit = data.limit || 10;
    const sortBy = data.sortBy || "revenue";

    // Get top products
    const topProducts = await getTopProducts(range, limit, sortBy);

    return {
      success: true,
      data: {
        topProducts,
        range,
      },
    };
  } catch (error) {
    console.error("Get product analytics error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get product analytics",
    };
  }
}
