import { db, schema } from "@ecommerce/database";
import { orderEmail, orderReference } from "@ecommerce/mailbox";
import { eq } from "drizzle-orm";
import { connection } from "next/server";

/** Who to write to about an order: the address its confirmation went to, and the name it shipped to. */
async function getOrderContact(orderId: string) {
  await connection();
  const [order] = await db
    .select({ id: schema.orders.id, shippingAddress: schema.orders.shippingAddress })
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
    .limit(1);
  if (!order) return null;
  return {
    orderId: order.id,
    reference: orderReference(order.id),
    email: await orderEmail(db, order.id),
    name: order.shippingAddress?.name ?? null,
  };
}

export { getOrderContact };
