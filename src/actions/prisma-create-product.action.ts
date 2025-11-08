"use server";

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
  try {
    const { name, description, images, unitAmount, currency = "usd" } = params;

    // Create product in Stripe
    const stripeProduct = await stripe.products.create({
      name,
      description: description || undefined,
      images: images || undefined,
    });

    // Create price in Stripe
    const stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: unitAmount,
      currency,
    });

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}
