"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { TaxType } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Create a new tax rate
 */
export async function createTaxRate(data: {
  country: string;
  state?: string;
  city?: string;
  postalCode?: string;
  rate: number;
  type: TaxType;
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  priority?: number;
  isActive?: boolean;
}) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate rate
    if (data.rate < 0 || data.rate > 1) {
      return { success: false, error: "Tax rate must be between 0 and 1" };
    }

    // Check for existing rate with same location
    const existing = await prisma.taxRate.findFirst({
      where: {
        country: data.country,
        state: data.state || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
      },
    });

    if (existing) {
      return {
        success: false,
        error: "A tax rate already exists for this location",
      };
    }

    // Create tax rate
    const taxRate = await prisma.taxRate.create({
      data: {
        country: data.country,
        state: data.state,
        city: data.city,
        postalCode: data.postalCode,
        rate: data.rate,
        type: data.type,
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        priority: data.priority || 1,
        isActive: data.isActive ?? true,
      },
    });

    revalidatePath("/admin/settings/tax");
    return { success: true, data: taxRate };
  } catch (error) {
    console.error("Create tax rate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tax rate",
    };
  }
}

/**
 * Update an existing tax rate
 */
export async function updateTaxRate(
  id: string,
  data: {
    rate?: number;
    type?: TaxType;
    name?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
    isActive?: boolean;
  },
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate rate if provided
    if (data.rate !== undefined && (data.rate < 0 || data.rate > 1)) {
      return { success: false, error: "Tax rate must be between 0 and 1" };
    }

    // Update tax rate
    const taxRate = await prisma.taxRate.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/settings/tax");
    return { success: true, data: taxRate };
  } catch (error) {
    console.error("Update tax rate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update tax rate",
    };
  }
}

/**
 * Delete a tax rate
 */
export async function deleteTaxRate(id: string) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.taxRate.delete({
      where: { id },
    });

    revalidatePath("/admin/settings/tax");
    return { success: true };
  } catch (error) {
    console.error("Delete tax rate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tax rate",
    };
  }
}

/**
 * Get all tax rates with optional filtering
 */
export async function getTaxRates(filters?: {
  country?: string;
  state?: string;
  city?: string;
  type?: TaxType;
  isActive?: boolean;
}) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    const taxRates = await prisma.taxRate.findMany({
      where: {
        ...(filters?.country && { country: filters.country }),
        ...(filters?.state && { state: filters.state }),
        ...(filters?.city && { city: filters.city }),
        ...(filters?.type && { type: filters.type }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: [{ priority: "desc" }, { country: "asc" }, { state: "asc" }, { city: "asc" }],
    });

    return { success: true, data: taxRates };
  } catch (error) {
    console.error("Get tax rates error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tax rates",
    };
  }
}

/**
 * Get a single tax rate by ID
 */
export async function getTaxRateById(id: string) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    const taxRate = await prisma.taxRate.findUnique({
      where: { id },
    });

    if (!taxRate) {
      return { success: false, error: "Tax rate not found" };
    }

    return { success: true, data: taxRate };
  } catch (error) {
    console.error("Get tax rate error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tax rate",
    };
  }
}

/**
 * Bulk import tax rates from array
 */
export async function bulkImportTaxRates(
  rates: Array<{
    country: string;
    state?: string;
    city?: string;
    postalCode?: string;
    rate: number;
    type: TaxType;
    name: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: number;
  }>,
) {
  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user?.roles?.includes("ADMIN")) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate all rates
    for (const rate of rates) {
      if (rate.rate < 0 || rate.rate > 1) {
        return {
          success: false,
          error: `Invalid tax rate for ${rate.name}: must be between 0 and 1`,
        };
      }
    }

    // Use createMany with skipDuplicates to avoid conflicts
    const result = await prisma.taxRate.createMany({
      data: rates.map((rate) => ({
        country: rate.country,
        state: rate.state,
        city: rate.city,
        postalCode: rate.postalCode,
        rate: rate.rate,
        type: rate.type,
        name: rate.name,
        description: rate.description,
        startDate: rate.startDate,
        endDate: rate.endDate,
        priority: rate.priority || 1,
        isActive: true,
      })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/settings/tax");
    return { success: true, data: { count: result.count } };
  } catch (error) {
    console.error("Bulk import tax rates error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to import tax rates",
    };
  }
}
