import { db } from "@ecommerce/database";
import { listThreads, type ThreadView } from "@ecommerce/mailbox";
import { connection } from "next/server";

/**
 * One page of conversations (admin). The mailbox is read fresh on every request rather than cached:
 * mail arrives through a webhook, and an inbox that lags behind it is worse than one that costs a query.
 */
async function getMailboxThreads(view: ThreadView, page: number) {
  await connection();
  return listThreads(db, { view, page, pageSize: 50 });
}

export { getMailboxThreads };
