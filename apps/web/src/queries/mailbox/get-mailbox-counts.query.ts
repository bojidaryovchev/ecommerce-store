import { db } from "@ecommerce/database";
import { countThreads } from "@ecommerce/mailbox";
import { connection } from "next/server";

/** How many conversations wait for an answer, are open, done, in all (admin). */
async function getMailboxCounts() {
  await connection();
  return countThreads(db);
}

export { getMailboxCounts };
