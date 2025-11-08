"use server";

import { sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Price } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface UpdatePriceParams {
  priceId: string;
  active?: boolean;
  metadata?: Record<string, string>;
}

/**
 * Update price settings
 * Note: Stripe does not allow updating unit_amount on existing prices.
 * To change pricing, create a new price and archive the old one.
 */
export async function prismaUpdatePrice(params: UpdatePriceParams): Promise<ActionResult<Price>> {
  try {
    const { priceId, active, metadata } = params;

    // Get existing price
    const existingPrice = await prisma.price.findUnique({
      where: { id: priceId },
    });

    if (!existingPrice) {
      return {
        success: false,
        error: "Price not found",
      };
    }

    // Update price in Stripe if stripePriceId exists
    if (existingPrice.stripePriceId) {
      const stripeUpdateData: {
        active?: boolean;
        metadata?: Record<string, string>;
      } = {};

      if (active !== undefined) {
        stripeUpdateData.active = active;
      }
      if (metadata !== undefined) {
        stripeUpdateData.metadata = metadata;
      }

      if (Object.keys(stripeUpdateData).length > 0) {
        await stripe.prices.update(existingPrice.stripePriceId, stripeUpdateData);
      }
    }

    // Update price in database
    const updateDbData: Record<string, boolean | Record<string, string>> = {};

    if (active !== undefined) {
      updateDbData.active = active;
    }
    if (metadata !== undefined) {
      updateDbData.metadata = metadata;
    }

    const price = await prisma.price.update({
      where: { id: priceId },
      data: updateDbData,
    });

    // Revalidate admin products page
    revalidatePath("/admin/products");

    return {
      success: true,
      data: price,
    };
  } catch (error) {
    console.error("Error updating price:", error);
    return {
      success: false,
      error: sanitizeError(error, "Unable to update price. Please try again."),
    };
  }
}
