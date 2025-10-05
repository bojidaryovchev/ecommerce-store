"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getAddresses() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in to view addresses." };
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    return { success: true, addresses };
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return { error: "Failed to fetch addresses. Please try again." };
  }
}

export async function getAddressById(id: string) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
    }

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return { error: "Address not found." };
    }

    // Verify ownership
    if (address.userId !== session.user.id) {
      return { error: "Unauthorized. This address does not belong to you." };
    }

    return { success: true, address };
  } catch (error) {
    console.error("Error fetching address:", error);
    return { error: "Failed to fetch address. Please try again." };
  }
}

export async function getDefaultAddress() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return { error: "Unauthorized. Please sign in." };
    }

    const address = await prisma.address.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });

    if (!address) {
      // If no default, return the first address
      const firstAddress = await prisma.address.findFirst({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      });

      return { success: true, address: firstAddress };
    }

    return { success: true, address };
  } catch (error) {
    console.error("Error fetching default address:", error);
    return { error: "Failed to fetch default address. Please try again." };
  }
}
