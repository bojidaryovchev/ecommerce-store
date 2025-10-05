"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateCartTax, getTaxRate } from "@/lib/tax-calculator";

/**
 * Calculate tax for checkout based on shipping address
 */
export async function calculateCheckoutTax(data: {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
  }>;
  shippingAddressId: string;
}) {
  try {
    // Get shipping address
    const address = await prisma.address.findUnique({
      where: { id: data.shippingAddressId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!address) {
      return { success: false, error: "Shipping address not found" };
    }

    // Verify address belongs to current user (for security)
    const session = await auth();
    if (session?.user?.id && address.userId !== session.user.id) {
      return { success: false, error: "Unauthorized access to address" };
    }

    // Get product details to include categoryId for exemption checks
    const productsData = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, categoryId: true },
        });
        return {
          price: item.price,
          quantity: item.quantity,
          productId: item.productId,
          categoryId: product?.categoryId || undefined,
        };
      }),
    );

    // Calculate tax for all items
    const taxResult = await calculateCartTax(
      productsData,
      address.country,
      address.state || undefined,
      address.city || undefined,
      address.postalCode || undefined,
    );

    // Get tax rate details for display
    const taxRateData = await getTaxRate(
      address.country,
      address.state || undefined,
      address.city || undefined,
      address.postalCode || undefined,
    );

    return {
      success: true,
      data: {
        ...taxResult,
        taxRate: taxRateData?.rate || 0,
        taxType: taxRateData?.type || "EXEMPT",
        taxName: taxRateData?.name || "No Tax",
      },
    };
  } catch (error) {
    console.error("Calculate checkout tax error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate tax",
    };
  }
}

/**
 * Get applicable tax rate for a specific address
 */
export async function getTaxRateForAddress(addressId: string) {
  try {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address) {
      return { success: false, error: "Address not found" };
    }

    const taxRate = await getTaxRate(
      address.country,
      address.state || undefined,
      address.city || undefined,
      address.postalCode || undefined,
    );

    if (!taxRate) {
      return {
        success: true,
        data: {
          rate: 0,
          type: "EXEMPT" as const,
          name: "No Tax",
          isExempt: true,
        },
      };
    }

    return {
      success: true,
      data: {
        rate: taxRate.rate,
        type: taxRate.type,
        name: taxRate.name,
        isExempt: taxRate.rate === 0,
      },
    };
  } catch (error) {
    console.error("Get tax rate for address error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get tax rate",
    };
  }
}
