"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function setDefaultAddress(id: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to set a default address." };
    }

    // Find the address and verify ownership
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return { error: "Address not found." };
    }

    if (address.userId !== session.user.id) {
      return { error: "Unauthorized. This address does not belong to you." };
    }

    // Unset all other default addresses
    await prisma.address.updateMany({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      data: { isDefault: false },
    });

    // Set this address as default
    const updatedAddress = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    revalidatePath("/account/addresses");
    return { success: true, address: updatedAddress };
  } catch (error) {
    console.error("Error setting default address:", error);
    return { error: "Failed to set default address. Please try again." };
  }
}
