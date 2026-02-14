import { CACHE_TAGS } from "@/lib/cache-tags";
import { db, schema } from "@ecommerce/database";
import { eq } from "drizzle-orm";
import { cacheTag } from "next/cache";

/**
 * Get order by Stripe checkout session ID
 */
async function getOrderByCheckoutSessionId(sessionId: string) {
  "use cache";
  cacheTag(CACHE_TAGS.orders, CACHE_TAGS.checkoutSession(sessionId));
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.stripeCheckoutSessionId, sessionId),
    with: {
      items: {
        with: {
          product: true,
        },
      },
    },
  });

  return order;
}

export { getOrderByCheckoutSessionId };
