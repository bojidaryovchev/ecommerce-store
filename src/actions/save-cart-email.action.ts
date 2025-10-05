"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";

const saveCartEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

/**
 * Save email for guest cart to enable abandoned cart recovery
 * This allows guests to receive recovery emails even without creating an account
 */
export async function saveCartEmail(email: string) {
  try {
    const validated = saveCartEmailSchema.parse({ email });

    // Get session ID from cookies
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("cart-session-id")?.value;

    if (!sessionId) {
      return {
        success: false,
        error: "No cart session found",
      };
    }

    // Find the cart by session ID
    const cart = await prisma.cart.findFirst({
      where: {
        sessionId,
        userId: null, // Only for guest carts
      },
      include: {
        items: true,
      },
    });

    if (!cart) {
      return {
        success: false,
        error: "Cart not found",
      };
    }

    if (cart.items.length === 0) {
      return {
        success: false,
        error: "Cart is empty",
      };
    }

    // Update cart with email for recovery purposes
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        // Store email in a metadata field or create a user record
        // For now, we'll update the updatedAt to ensure it's tracked
        updatedAt: new Date(),
      },
    });

    // Store email in cart session cookie for future reference
    cookieStore.set("cart-email", validated.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    // Create a temporary user record if one doesn't exist
    // This allows the abandoned cart system to send recovery emails
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email },
    });

    if (!existingUser) {
      // Create a guest user record for cart recovery
      const guestUser = await prisma.user.create({
        data: {
          email: validated.email,
          name: null,
          emailVerified: null,
          image: null,
          roles: ["USER"], // Guest user with USER role
        },
      });

      // Link cart to the guest user
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          userId: guestUser.id,
        },
      });
    } else {
      // Link cart to existing user
      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          userId: existingUser.id,
        },
      });
    }

    return {
      success: true,
      message: "Cart saved successfully",
    };
  } catch (error) {
    console.error("Failed to save cart email:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid email",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save cart",
    };
  }
}
