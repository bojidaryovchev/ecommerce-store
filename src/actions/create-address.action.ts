"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressSchema } from "@/schemas/address.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createAddress(data: z.infer<typeof addressSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to add addresses." };
    }

    // Validate input
    const validatedData = addressSchema.parse({
      ...data,
      userId: session.user.id,
    });

    // Check if user has any addresses
    const existingAddresses = await prisma.address.findMany({
      where: { userId: session.user.id },
    });

    // If this is the first address, set it as default
    const isFirstAddress = existingAddresses.length === 0;
    const shouldBeDefault = isFirstAddress || validatedData.isDefault;

    // If setting as default, unset other defaults
    if (shouldBeDefault) {
      await prisma.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Create the address
    const address = await prisma.address.create({
      data: {
        ...validatedData,
        isDefault: shouldBeDefault,
      },
    });

    revalidatePath("/account/addresses");
    return { success: true, address };
  } catch (error) {
    console.error("Error creating address:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid address data. Please check your inputs." };
    }

    return { error: "Failed to create address. Please try again." };
  }
}
