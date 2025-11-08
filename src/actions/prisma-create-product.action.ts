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
