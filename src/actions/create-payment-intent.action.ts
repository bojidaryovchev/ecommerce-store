"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface CreatePaymentIntentData {
  orderId: string;
  amount: number; // in cents
  currency?: string;
  metadata?: Record<string, string>;
}

/**
 * Create a Stripe Payment Intent for an order
 * This should be called when the user is ready to pay
 */
export async function createPaymentIntent(data: CreatePaymentIntentData): Promise<CreatePaymentIntentResult> {
  try {
    const { orderId, amount, currency = "usd", metadata = {} } = data;

    // Validate order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentIntentId: true,
        customerEmail: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    // Check if payment intent already exists for this order
    if (order.paymentIntentId) {
      try {
        // Retrieve existing payment intent
        const existingIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId);

        // If it's still in a usable state, return it
        if (
          existingIntent.status === "requires_payment_method" ||
          existingIntent.status === "requires_confirmation" ||
          existingIntent.status === "requires_action"
        ) {
          return {
            success: true,
            clientSecret: existingIntent.client_secret || undefined,
            paymentIntentId: existingIntent.id,
          };
        }
      } catch (error) {
        // Payment intent might not exist or be invalid, create a new one
        console.warn("Existing payment intent not valid, creating new one:", error);
      }
    }

    // Create payment intent metadata
    const paymentMetadata: Stripe.MetadataParam = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      ...metadata,
    };

    // Create new payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: paymentMetadata,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: order.user?.email || order.customerEmail || undefined,
    });

    // Update order with payment intent ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentStatus: "PENDING",
      },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent",
    };
  }
}

/**
 * Confirm a payment intent after client-side confirmation
 * This is called after the user completes payment on the client
 */
export async function confirmPaymentIntent(paymentIntentId: string): Promise<CreatePaymentIntentResult> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Update order payment status
      await prisma.order.updateMany({
        where: { paymentIntentId },
        data: {
          paymentStatus: "PAID",
        },
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
      };
    }

    return {
      success: false,
      error: `Payment intent status: ${paymentIntent.status}`,
    };
  } catch (error) {
    console.error("Failed to confirm payment intent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to confirm payment intent",
    };
  }
}
