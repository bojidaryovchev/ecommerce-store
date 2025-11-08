"use server";

import { ErrorMessages, sanitizeError } from "@/lib/error-handler";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import type { ActionResult } from "@/types/action-result.type";
import type { Product } from "@prisma/client";
import { revalidatePath } from "next/cache";

interface CreateProductParams {
  name: string;
  description?: string;
  images?: string[];
  unitAmount: number;
  currency?: string;
}

export async function prismaCreateProduct(params: CreateProductParams): Promise<ActionResult<Product>> {
  let stripeProductId: string | undefined;
  let stripePriceId: string | undefined;

  try {
    const { name, description, images, unitAmount, currency = "usd" } = params;

    // Server-side validation (defense-in-depth)
    if (!name || name.trim().length === 0) {
      return { success: false, error: "Product name is required" };
    }
    if (name.length > 500) {
      return { success: false, error: "Product name must not exceed 500 characters" };
    }
    if (description && description.length > 5000) {
      return { success: false, error: "Description must not exceed 5000 characters" };
    }
    if (images && images.length > 10) {
      return { success: false, error: "Maximum 10 images allowed" };
    }
    if (images) {
      // Validate each image is a valid URL
      for (const img of images) {
        try {
          new URL(img);
        } catch {
          return { success: false, error: `Invalid image URL: ${img}` };
        }
      }
    }
    if (!Number.isInteger(unitAmount)) {
      return { success: false, error: "Unit amount must be an integer (in cents)" };
    }
    if (unitAmount < 0) {
      return { success: false, error: "Unit amount cannot be negative" };
    }
    if (unitAmount > 99999999) {
      return { success: false, error: "Unit amount exceeds maximum (999,999.99)" };
    }
    const validCurrencies = ["usd", "eur", "gbp", "jpy", "cad", "aud"];
    if (!validCurrencies.includes(currency.toLowerCase())) {
      return { success: false, error: "Invalid currency. Must be one of: USD, EUR, GBP, JPY, CAD, AUD" };
    }

    // Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
      images: images || undefined,
    });
    stripeProductId = stripeProduct.id;

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmount,
      currency,
    });
    stripePriceId = stripePrice.id;

    // Create product in database
    const product = await prisma.product.create({
      data: {
        name,
        description,
        images: images || [],
        stripeProductId: stripeProduct.id,
        prices: {
          create: {
            unitAmount,
            currency,
            stripePriceId: stripePrice.id,
            type: "ONE_TIME",
          },
        },
      },
      include: {
        prices: true,
      },
    });

    // Revalidate admin products page
    revalidatePath("/admin/products");

    return {
      success: true,
      data: product,
    };
  } catch (error) {
    console.error("Error creating product:", error);

    // If database creation failed but Stripe resources were created, log for manual cleanup
    if (stripeProductId) {
      console.error(
        `Orphaned Stripe product created - Product ID: ${stripeProductId}${stripePriceId ? `, Price ID: ${stripePriceId}` : ""}`,
        "Manual cleanup or archival may be required.",
      );
    }

    return {
      success: false,
      error: sanitizeError(error, ErrorMessages.PRODUCT_CREATE_FAILED),
    };
  }
}
