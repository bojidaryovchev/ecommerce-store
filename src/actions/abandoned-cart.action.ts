"use server";

import {
  DEFAULT_ABANDONMENT_CONFIG,
  detectAbandonedCarts,
  getRecoveryStats,
  markCartAsAbandoned,
  markCartAsRecovered,
  type AbandonmentConfig,
} from "@/lib/abandoned-cart-detector";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

/**
 * Get abandoned carts for admin dashboard
 * Requires ADMIN role
 */
export async function getAbandonedCarts(filters?: {
  status?: "all" | "pending" | "recovered";
  minValue?: number;
  maxValue?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.roles?.includes("ADMIN")) {
      throw new Error("Unauthorized");
    }

    const where: {
      isRecovered?: boolean;
      cartTotal?: { gte?: number; lte?: number };
      abandonedAt?: { gte?: Date; lte?: Date };
    } = {};

    // Filter by status
    if (filters?.status === "recovered") {
      where.isRecovered = true;
    } else if (filters?.status === "pending") {
      where.isRecovered = false;
    }

    // Filter by value
    if (filters?.minValue !== undefined) {
      where.cartTotal = {
        ...where.cartTotal,
        gte: filters.minValue,
      };
    }
    if (filters?.maxValue !== undefined) {
      where.cartTotal = {
        ...where.cartTotal,
        lte: filters.maxValue,
      };
    }

    // Filter by date
    if (filters?.startDate) {
      where.abandonedAt = {
        ...where.abandonedAt,
        gte: filters.startDate,
      };
    }
    if (filters?.endDate) {
      where.abandonedAt = {
        ...where.abandonedAt,
        lte: filters.endDate,
      };
    }

    const abandonedCarts = await prisma.abandonedCart.findMany({
      where,
      include: {
        cart: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        abandonedAt: "desc",
      },
      take: 100, // Limit to recent 100
    });

    return {
      success: true,
      data: abandonedCarts.map((cart) => ({
        id: cart.id,
        cartId: cart.cartId,
        userEmail: cart.userEmail,
        userName: cart.userName,
        itemCount: cart.itemCount,
        cartTotal: Number(cart.cartTotal),
        remindersSent: cart.remindersSent,
        lastReminderSent: cart.lastReminderSent,
        isRecovered: cart.isRecovered,
        recoveredAt: cart.recoveredAt,
        orderCreated: cart.orderCreated,
        orderId: cart.orderId,
        recoveryChannel: cart.recoveryChannel,
        abandonedAt: cart.abandonedAt,
        recoveryToken: cart.recoveryToken,
      })),
    };
  } catch (error) {
    console.error("Failed to get abandoned carts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get abandoned carts",
    };
  }
}

/**
 * Detect and mark new abandoned carts
 * Requires ADMIN role
 */
export async function detectAndMarkAbandonedCarts(config?: Partial<AbandonmentConfig>) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.roles?.includes("ADMIN")) {
      throw new Error("Unauthorized");
    }

    const fullConfig = { ...DEFAULT_ABANDONMENT_CONFIG, ...config };
    const candidates = await detectAbandonedCarts(fullConfig);

    const results = [];
    for (const candidate of candidates) {
      const result = await markCartAsAbandoned(candidate);
      results.push(result);
    }

    return {
      success: true,
      data: {
        detected: candidates.length,
        marked: results.length,
        candidates: candidates.map((c) => ({
          cartId: c.cartId,
          userEmail: c.userEmail,
          cartTotal: c.cartTotal,
          itemCount: c.itemCount,
        })),
      },
    };
  } catch (error) {
    console.error("Failed to detect abandoned carts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to detect abandoned carts",
    };
  }
}

/**
 * Send recovery email to specific abandoned cart
 * Requires ADMIN role (for manual sending)
 */
export async function sendRecoveryEmail(abandonedCartId: string) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.roles?.includes("ADMIN")) {
      throw new Error("Unauthorized");
    }

    const abandonedCart = await prisma.abandonedCart.findUnique({
      where: { id: abandonedCartId },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: {
                  include: {
                    images: {
                      take: 1,
                      orderBy: {
                        position: "asc",
                      },
                    },
                  },
                },
                variant: true,
              },
            },
          },
        },
      },
    });

    if (!abandonedCart) {
      throw new Error("Abandoned cart not found");
    }

    if (abandonedCart.isRecovered) {
      throw new Error("Cart already recovered");
    }

    const reminderNumber = (abandonedCart.remindersSent + 1) as 1 | 2 | 3;

    // TODO: Implement actual email sending using AWS SES, Resend, or similar
    // For now, we'll just update the reminder count and log the email that would be sent

    // Import email templates (uncomment when ready to send)
    // const { generateAbandonedCartEmailHTML, generateAbandonedCartEmailText, getAbandonedCartEmailSubject } =
    //   await import("@/lib/email-templates/abandoned-cart-email");

    // const emailData = {
    //   userName: abandonedCart.userName,
    //   userEmail: abandonedCart.userEmail,
    //   cartItems: abandonedCart.cart.items.map(item => ({
    //     productName: item.product.name,
    //     variantName: item.variant?.name,
    //     quantity: item.quantity,
    //     price: item.variant?.price || item.product.price,
    //     imageUrl: item.product.images[0]?.url,
    //   })),
    //   cartTotal: Number(abandonedCart.cartTotal),
    //   recoveryLink: `${process.env.NEXT_PUBLIC_APP_URL}/cart/recover/${abandonedCart.recoveryToken}`,
    //   reminderNumber,
    //   // Add discount for final reminder (optional)
    //   discountCode: reminderNumber === 3 ? "COMEBACK10" : undefined,
    //   discountAmount: reminderNumber === 3 ? 10 : undefined,
    // };

    // const htmlContent = generateAbandonedCartEmailHTML(emailData);
    // const textContent = generateAbandonedCartEmailText(emailData);
    // const subject = getAbandonedCartEmailSubject(reminderNumber, emailData.discountCode, emailData.discountAmount);

    // await sendEmail({
    //   to: abandonedCart.userEmail,
    //   subject,
    //   html: htmlContent,
    //   text: textContent,
    // });

    await prisma.abandonedCart.update({
      where: { id: abandonedCartId },
      data: {
        remindersSent: {
          increment: 1,
        },
        lastReminderSent: new Date(),
      },
    });

    return {
      success: true,
      message: `Recovery email #${reminderNumber} would be sent to ${abandonedCart.userEmail}`,
    };
  } catch (error) {
    console.error("Failed to send recovery email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send recovery email",
    };
  }
}

/**
 * Recover a cart using recovery token
 * Public endpoint - no auth required
 */
const recoverCartSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function recoverCart(token: string) {
  try {
    const validatedData = recoverCartSchema.parse({ token });

    const abandonedCart = await prisma.abandonedCart.findUnique({
      where: {
        recoveryToken: validatedData.token,
      },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: true,
                variant: true,
              },
            },
          },
        },
      },
    });

    if (!abandonedCart) {
      return {
        success: false,
        error: "Invalid or expired recovery link",
      };
    }

    // Check if token is expired
    if (new Date() > abandonedCart.tokenExpiresAt) {
      return {
        success: false,
        error: "Recovery link has expired",
      };
    }

    // Check if already recovered
    if (abandonedCart.isRecovered) {
      return {
        success: false,
        error: "This cart has already been recovered",
      };
    }

    // Get current session
    const session = await auth();

    // If user is logged in, merge cart
    if (session?.user) {
      // Check if user already has a cart
      let userCart = await prisma.cart.findFirst({
        where: { userId: session.user.id },
      });

      if (!userCart) {
        // Update abandoned cart to belong to user
        userCart = await prisma.cart.update({
          where: { id: abandonedCart.cartId },
          data: {
            userId: session.user.id,
            sessionId: null,
          },
        });
      } else {
        // Merge items from abandoned cart into user cart
        for (const item of abandonedCart.cart.items) {
          const existingItem = await prisma.cartItem.findFirst({
            where: {
              cartId: userCart.id,
              productId: item.productId,
              variantId: item.variantId,
            },
          });

          if (existingItem) {
            // Update quantity
            await prisma.cartItem.update({
              where: { id: existingItem.id },
              data: {
                quantity: Math.min(existingItem.quantity + item.quantity, 999),
              },
            });
          } else {
            // Add new item
            await prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              },
            });
          }
        }

        // Delete old cart
        await prisma.cart.delete({
          where: { id: abandonedCart.cartId },
        });
      }
    }

    // Mark as recovered
    await markCartAsRecovered(abandonedCart.id, undefined, "recovery_link");

    return {
      success: true,
      message: "Cart recovered successfully",
      cartId: abandonedCart.cartId,
    };
  } catch (error) {
    console.error("Failed to recover cart:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid input",
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to recover cart",
    };
  }
}

/**
 * Get recovery statistics
 * Requires ADMIN role
 */
export async function getAbandonedCartStats(startDate?: Date, endDate?: Date) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.roles?.includes("ADMIN")) {
      throw new Error("Unauthorized");
    }

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate || new Date();

    const stats = await getRecoveryStats(start, end);

    // Get additional stats
    const totalCarts = await prisma.abandonedCart.count({
      where: {
        abandonedAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const avgCartValue = await prisma.abandonedCart.aggregate({
      where: {
        abandonedAt: {
          gte: start,
          lte: end,
        },
      },
      _avg: {
        cartTotal: true,
      },
    });

    const recoveredValue = await prisma.abandonedCart.aggregate({
      where: {
        abandonedAt: {
          gte: start,
          lte: end,
        },
        isRecovered: true,
      },
      _sum: {
        cartTotal: true,
      },
    });

    return {
      success: true,
      data: {
        ...stats,
        totalCarts,
        avgCartValue: Number(avgCartValue._avg.cartTotal) || 0,
        recoveredValue: Number(recoveredValue._sum.cartTotal) || 0,
        dateRange: {
          start,
          end,
        },
      },
    };
  } catch (error) {
    console.error("Failed to get stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get stats",
    };
  }
}

/**
 * Delete old abandoned cart records (cleanup)
 * Requires ADMIN role
 */
export async function cleanupOldAbandonedCarts(daysOld: number = 90) {
  try {
    const session = await auth();
    if (!session?.user || !session.user.roles?.includes("ADMIN")) {
      throw new Error("Unauthorized");
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.abandonedCart.deleteMany({
      where: {
        abandonedAt: {
          lt: cutoffDate,
        },
      },
    });

    return {
      success: true,
      message: `Deleted ${result.count} old abandoned cart records`,
      deletedCount: result.count,
    };
  } catch (error) {
    console.error("Failed to cleanup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cleanup",
    };
  }
}
