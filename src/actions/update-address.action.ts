"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addressUpdateSchema } from "@/schemas/address.schema";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function updateAddress(id: string, data: z.infer<typeof addressUpdateSchema>) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to update addresses." };
    }

    // Find the address and verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return { error: "Address not found." };
    }

    if (existingAddress.userId !== session.user.id) {
      return { error: "Unauthorized. This address does not belong to you." };
    }

    // Validate input
    const validatedData = addressUpdateSchema.parse({
      ...data,
      userId: session.user.id,
    });

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: session.user.id,
          isDefault: true,
          NOT: { id },
        },
        data: { isDefault: false },
      });
    }

    // Update the address
    const address = await prisma.address.update({
      where: { id },
      data: validatedData,
    });

    revalidatePath("/account/addresses");
    return { success: true, address };
  } catch (error) {
    console.error("Error updating address:", error);

    if (error instanceof z.ZodError) {
      return { error: "Invalid address data. Please check your inputs." };
    }

    return { error: "Failed to update address. Please try again." };
  }
}
