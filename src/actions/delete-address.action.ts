"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteAddress(id: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to delete addresses." };
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

    // Check if this is the user's only address
    const addressCount = await prisma.address.count({
      where: { userId: session.user.id },
    });

    if (addressCount === 1) {
      return {
        error: "Cannot delete your only address. Please add another address first.",
      };
    }

    // If this is the default address, set another address as default
    if (address.isDefault) {
      // Find another address to set as default
      const otherAddress = await prisma.address.findFirst({
        where: {
          userId: session.user.id,
          NOT: { id },
        },
        orderBy: { createdAt: "desc" },
      });

      if (otherAddress) {
        await prisma.address.update({
          where: { id: otherAddress.id },
          data: { isDefault: true },
        });
      }
    }

    // Delete the address
    await prisma.address.delete({
      where: { id },
    });

    revalidatePath("/account/addresses");
    return { success: true };
  } catch (error) {
    console.error("Error deleting address:", error);
    return { error: "Failed to delete address. Please try again." };
  }
}
