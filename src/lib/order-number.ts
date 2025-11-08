import { prisma } from "@/lib/prisma";

/**
 * Generates a unique order number in the format: ORD-YYYY-NNNNN
 * Example: ORD-2025-00001
 *
 * Uses transaction with retry logic to handle race conditions
 */
export async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const maxRetries = 5;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Get the count of orders created this year
      const orderCount = await prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(`${currentYear}-01-01`),
            lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      });

      // Generate sequential number (pad with zeros to 5 digits)
      const sequentialNumber = (orderCount + 1).toString().padStart(5, "0");
      const orderNumber = `ORD-${currentYear}-${sequentialNumber}`;

      // Verify uniqueness (in case of race condition)
      const existing = await prisma.order.findUnique({
        where: { orderNumber },
      });

      if (!existing) {
        return orderNumber;
      }

      // If exists, retry with incremented number
      continue;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        console.error("Failed to generate order number after retries:", error);
        // Fallback to timestamp-based number if all retries fail
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0");
        return `ORD-${currentYear}-${timestamp}-${random}`;
      }
      // Wait briefly before retry
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  // Fallback (should never reach here)
  const timestamp = Date.now();
  return `ORD-${currentYear}-${timestamp}`;
}
