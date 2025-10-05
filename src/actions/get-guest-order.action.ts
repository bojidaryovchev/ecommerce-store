"use server";

import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Schema for guest order lookup
 */
const guestOrderLookupSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required"),
});

export type GuestOrderLookupData = z.infer<typeof guestOrderLookupSchema>;

/**
 * Order data returned for guest tracking
 */
export interface GuestOrderData {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  customerName: string | null;
  customerEmail: string | null;
  shippingAddress: {
    fullName: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
  } | null;
  items: Array<{
    id: string;
    productName: string;
    productSlug: string;
    productImage: string | null;
    sku: string | null;
    variantName: string | null;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  isGift: boolean;
  giftMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lookup order by order number and email (for guest order tracking)
 * This allows guests to track their orders without creating an account
 *
 * @param data - Order number and email
 * @returns Order data if found and email matches, null otherwise
 */
export async function getGuestOrder(
  data: GuestOrderLookupData,
): Promise<{ success: boolean; data?: GuestOrderData; error?: string }> {
  try {
    // Validate input
    const validatedData = guestOrderLookupSchema.parse(data);

    // Find order by order number
    const order = await prisma.order.findUnique({
      where: {
        orderNumber: validatedData.orderNumber,
      },
      include: {
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
        shippingAddress: true,
      },
    });

    // Order not found
    if (!order) {
      return {
        success: false,
        error: "Order not found. Please check your order number and try again.",
      };
    }

    // Verify email matches
    // For guest orders: check customerEmail
    // For user orders: check user.email (if they provided the email)
    const emailMatches = order.customerEmail?.toLowerCase() === validatedData.email.toLowerCase();

    if (!emailMatches) {
      // Security: Don't reveal whether order exists if email doesn't match
      return {
        success: false,
        error: "Order not found. Please check your order number and email address.",
      };
    }

    // Format shipping address
    let shippingAddress = null;
    if (order.shippingAddress) {
      const addr = order.shippingAddress;
      shippingAddress = {
        fullName: addr.fullName,
        address1: addr.address1,
        address2: addr.address2,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      };
    }

    // Format order data for guest view
    const orderData: GuestOrderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total.toNumber(),
      subtotal: order.subtotal.toNumber(),
      taxAmount: order.taxAmount?.toNumber() || 0,
      shippingAmount: order.shippingAmount?.toNumber() || 0,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.productName,
        productSlug: item.productSlug,
        productImage: item.productImage,
        sku: item.sku,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
      })),
      isGift: order.isGift,
      giftMessage: order.giftMessage,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return {
      success: true,
      data: orderData,
    };
  } catch (error) {
    console.error("Failed to lookup guest order:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid input",
      };
    }

    return {
      success: false,
      error: "An error occurred while looking up your order. Please try again.",
    };
  }
}

/**
 * Check if an order belongs to a guest (has customerEmail but no userId)
 * This can be used to determine if guest order tracking should be shown
 *
 * @param orderNumber - Order number to check
 * @returns true if order is a guest order, false otherwise
 */
export async function isGuestOrder(orderNumber: string): Promise<boolean> {
  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        userId: true,
        customerEmail: true,
      },
    });

    if (!order) {
      return false;
    }

    // Guest order = no userId but has customerEmail
    return !order.userId && !!order.customerEmail;
  } catch (error) {
    console.error("Failed to check if guest order:", error);
    return false;
  }
}
