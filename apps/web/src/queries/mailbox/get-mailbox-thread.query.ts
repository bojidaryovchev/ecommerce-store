import { db } from "@ecommerce/database";
import { getThread, ordersForAddress } from "@ecommerce/mailbox";
import { connection } from "next/server";

/** One conversation with its messages, and the orders placed with the correspondent's address (admin). */
async function getMailboxThread(id: string) {
  await connection();
  const thread = await getThread(db, id);
  if (!thread) return null;
  const orders = await ordersForAddress(db, thread.correspondent);
  return { thread, orders };
}

export { getMailboxThread };
