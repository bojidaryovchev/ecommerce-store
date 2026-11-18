import type {
  MailMessage,
  MailThread,
  MailThreadStatus,
  NewMailMessage,
  OrderStatus,
} from "@ecommerce/database/schema";
import * as schema from "@ecommerce/database/schema";
import { and, asc, count, desc, eq, inArray, isNull, like, or, sql, type SQL } from "drizzle-orm";
import { sameAddress } from "./address";
import { normalizeSubject, orderReference } from "./subject";
import { readableBody, snippet } from "./text";
import type { DbExecutor } from "./types";

const { mailMessages, mailThreads, orders, users } = schema;

/* -- reading ---------------------------------------------------------------- */

/** "waiting": open, and the last word was theirs. The one question the inbox exists to answer. */
export type ThreadView = "waiting" | "open" | "done" | "all";
export const THREAD_VIEWS: readonly ThreadView[] = ["waiting", "open", "done", "all"];

const viewCondition = (view: ThreadView): SQL | undefined => {
  switch (view) {
    case "waiting":
      return and(eq(mailThreads.status, "open"), eq(mailThreads.lastMessageDirection, "in"));
    case "open":
      return eq(mailThreads.status, "open");
    case "done":
      return eq(mailThreads.status, "done");
    case "all":
      return undefined;
  }
};

export type ThreadSummary = MailThread & {
  messageCount: number;
  snippet: string;
  orderReference: string | null;
};

export async function listThreads(
  db: DbExecutor,
  options: { view?: ThreadView; page?: number; pageSize?: number } = {},
): Promise<{ threads: ThreadSummary[]; total: number; page: number; pageCount: number }> {
  const view = options.view ?? "all";
  const pageSize = Math.max(1, options.pageSize ?? 50);
  const page = Math.max(1, options.page ?? 1);
  const where = viewCondition(view);

  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(mailThreads).where(where);
  const threads = await db
    .select()
    .from(mailThreads)
    .where(where)
    .orderBy(desc(mailThreads.lastMessageAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (threads.length === 0) return { threads: [], total, page, pageCount: Math.ceil(total / pageSize) };
  const ids = threads.map((t) => t.id);

  /* The last message of each thread, for the preview line. Bodies are cut short in SQL: the list needs a
     line, not a message, and the HTML part of a mail is by far the biggest column here. */
  const last = await db
    .selectDistinctOn([mailMessages.threadId], {
      threadId: mailMessages.threadId,
      direction: mailMessages.direction,
      bodyText: sql<string | null>`left(${mailMessages.bodyText}, 4000)`,
      bodyHtml: sql<
        string | null
      >`case when ${mailMessages.bodyText} is null then left(${mailMessages.bodyHtml}, 20000) end`,
    })
    .from(mailMessages)
    .where(inArray(mailMessages.threadId, ids))
    .orderBy(mailMessages.threadId, desc(mailMessages.createdAt));
  const counts = await db
    .select({ threadId: mailMessages.threadId, count: count() })
    .from(mailMessages)
    .where(inArray(mailMessages.threadId, ids))
    .groupBy(mailMessages.threadId);

  return {
    threads: threads.map((thread) => {
      const message = last.find((m) => m.threadId === thread.id);
      return {
        ...thread,
        messageCount: counts.find((c) => c.threadId === thread.id)?.count ?? 0,
        snippet: message ? snippet(readableBody(message)) : "",
        orderReference: thread.orderId ? orderReference(thread.orderId) : null,
      };
    }),
    total,
    page,
    pageCount: Math.ceil(total / pageSize),
  };
}

/** How many threads each view holds, for the tabs and the sidebar badge. */
export async function countThreads(db: DbExecutor): Promise<Record<ThreadView, number>> {
  const rows = await db
    .select({ status: mailThreads.status, direction: mailThreads.lastMessageDirection, count: count() })
    .from(mailThreads)
    .groupBy(mailThreads.status, mailThreads.lastMessageDirection);
  const sum = (match: (row: (typeof rows)[number]) => boolean) =>
    rows.filter(match).reduce((total, row) => total + row.count, 0);
  return {
    waiting: sum((r) => r.status === "open" && r.direction === "in"),
    open: sum((r) => r.status === "open"),
    done: sum((r) => r.status === "done"),
    all: sum(() => true),
  };
}

export type OrderSummary = {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
};

const orderSummaryColumns = {
  id: orders.id,
  status: orders.status,
  totalAmount: orders.totalAmount,
  currency: orders.currency,
  createdAt: orders.createdAt,
};

export type ThreadDetail = MailThread & { messages: MailMessage[]; order: OrderSummary | null };

export async function getThread(db: DbExecutor, id: string): Promise<ThreadDetail | null> {
  const [thread] = await db.select().from(mailThreads).where(eq(mailThreads.id, id)).limit(1);
  if (!thread) return null;
  const messages = await db
    .select()
    .from(mailMessages)
    .where(eq(mailMessages.threadId, id))
    .orderBy(asc(mailMessages.createdAt));
  const [order] = thread.orderId
    ? await db.select(orderSummaryColumns).from(orders).where(eq(orders.id, thread.orderId)).limit(1)
    : [];
  return { ...thread, messages, order: order ?? null };
}

export async function getMessage(db: DbExecutor, id: string): Promise<MailMessage | null> {
  const [message] = await db.select().from(mailMessages).where(eq(mailMessages.id, id)).limit(1);
  return message ?? null;
}

/** The orders placed with this address, newest first: context next to a conversation. */
export async function ordersForAddress(db: DbExecutor, address: string, limit = 10): Promise<OrderSummary[]> {
  const email = address.trim().toLowerCase();
  if (!email.includes("@")) return [];
  return db
    .select(orderSummaryColumns)
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(or(eq(sql`lower(${orders.guestEmail})`, email), eq(sql`lower(${users.email})`, email)))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** The email an order's confirmation went to (Stripe Checkout's), or its account's. */
export async function orderEmail(db: DbExecutor, orderId: string): Promise<string | null> {
  const [row] = await db
    .select({ guestEmail: orders.guestEmail, userEmail: users.email })
    .from(orders)
    .leftJoin(users, eq(users.id, orders.userId))
    .where(eq(orders.id, orderId))
    .limit(1);
  return row?.guestEmail ?? row?.userEmail ?? null;
}

/* -- threading -------------------------------------------------------------- */

/** The thread one of these Message-IDs belongs to, but only if it is this correspondent's. */
export async function findThreadByMessageIds(
  db: DbExecutor,
  messageIds: string[],
  correspondent: string,
): Promise<string | null> {
  if (messageIds.length === 0) return null;
  const [row] = await db
    .select({ threadId: mailMessages.threadId })
    .from(mailMessages)
    .innerJoin(mailThreads, eq(mailThreads.id, mailMessages.threadId))
    .where(
      and(
        inArray(mailMessages.messageId, messageIds.slice(0, 50)),
        eq(sql`lower(${mailThreads.correspondent})`, correspondent.trim().toLowerCase()),
      ),
    )
    .orderBy(desc(mailThreads.lastMessageAt))
    .limit(1);
  return row?.threadId ?? null;
}

/** This correspondent's open thread with the same subject, reply prefixes aside. */
export async function findOpenThreadBySubject(
  db: DbExecutor,
  correspondent: string,
  subject: string,
): Promise<string | null> {
  const wanted = normalizeSubject(subject);
  // Normalising in SQL would mean teaching Postgres every client's reply prefixes. The correspondent
  // narrows this to a handful of rows, so the comparison happens here.
  const rows = await db
    .select({ id: mailThreads.id, subject: mailThreads.subject })
    .from(mailThreads)
    .where(
      and(
        eq(sql`lower(${mailThreads.correspondent})`, correspondent.trim().toLowerCase()),
        eq(mailThreads.status, "open"),
      ),
    )
    .orderBy(desc(mailThreads.lastMessageAt))
    .limit(50);
  return rows.find((r) => normalizeSubject(r.subject) === wanted)?.id ?? null;
}

/**
 * Which conversation an incoming message belongs to.
 *
 * Two signals, in order of trust. The References chain is authoritative when it matches: clients
 * accumulate every ancestor id, so a reply to OUR reply still carries the id of the customer's first
 * message, which we stored. The subject is the fallback for a client that sends a fresh message about
 * the same thing, and only among open threads.
 *
 * BOTH ARE SCOPED TO THE CORRESPONDENT. One thread is one correspondent, and a reply goes to that
 * correspondent; anyone else (a colleague on copy, or a stranger who has learnt a Message-ID or a
 * subject) starts a thread of their own rather than joining somebody else's conversation.
 */
export async function matchThread(
  db: DbExecutor,
  references: string[],
  correspondent: string,
  subject: string,
): Promise<string | null> {
  return (
    (await findThreadByMessageIds(db, references, correspondent)) ??
    (await findOpenThreadBySubject(db, correspondent, subject))
  );
}

/**
 * The order a subject refers to ("Re: Order Confirmed — #7a1ffab1"), if that order was placed with this
 * address. The reference alone is short enough to guess; the address is what makes it theirs.
 */
export async function findOrderByReference(
  db: DbExecutor,
  references: string[],
  address: string,
): Promise<string | null> {
  for (const reference of references) {
    if (!/^[0-9a-f]{8}$/.test(reference)) continue;
    const rows = await db
      .select({ id: orders.id, guestEmail: orders.guestEmail, userEmail: users.email })
      .from(orders)
      .leftJoin(users, eq(users.id, orders.userId))
      .where(like(orders.id, `${reference}%`))
      .limit(5);
    const match = rows.find(
      (row) =>
        (row.guestEmail && sameAddress(row.guestEmail, address)) ||
        (row.userEmail && sameAddress(row.userEmail, address)),
    );
    if (match) return match.id;
  }
  return null;
}

/* -- writing ---------------------------------------------------------------- */

export async function createThread(
  db: DbExecutor,
  values: {
    subject: string;
    correspondent: string;
    correspondentName: string | null;
    orderId?: string | null;
    createdAt: Date;
    direction: "in" | "out";
  },
): Promise<string> {
  const [row] = await db
    .insert(mailThreads)
    .values({
      subject: values.subject,
      correspondent: values.correspondent,
      correspondentName: values.correspondentName,
      orderId: values.orderId ?? null,
      lastMessageAt: values.createdAt,
      lastMessageDirection: values.direction,
      createdAt: values.createdAt,
    })
    .returning({ id: mailThreads.id });
  return row!.id;
}

/**
 * Add a message to its thread. False when it was already there: the id is Resend's, so a retried
 * webhook is a no-op. Any new message opens the thread again: a customer writing back to a conversation
 * marked done needs an answer, and after our reply we expect one.
 */
export async function addMessage(db: DbExecutor, message: NewMailMessage): Promise<boolean> {
  const inserted = await db
    .insert(mailMessages)
    .values(message)
    .onConflictDoNothing()
    .returning({ id: mailMessages.id });
  if (inserted.length === 0) return false;

  // Stored the way Drizzle stores a `timestamp` column: the UTC wall-clock time (the "Z" is ignored).
  const at = sql`${message.createdAt.toISOString()}::timestamp`;
  // Every right-hand side sees the row as it was, so the direction is compared with the old timestamp.
  await db
    .update(mailThreads)
    .set({
      lastMessageDirection: sql`case when ${at} >= ${mailThreads.lastMessageAt} then ${message.direction}::mail_direction else ${mailThreads.lastMessageDirection} end`,
      lastMessageAt: sql`greatest(${mailThreads.lastMessageAt}, ${at})`,
      status: "open",
      updatedAt: new Date(),
    })
    .where(eq(mailThreads.id, message.threadId));
  return true;
}

export async function setThreadStatus(db: DbExecutor, id: string, status: MailThreadStatus): Promise<void> {
  await db.update(mailThreads).set({ status, updatedAt: new Date() }).where(eq(mailThreads.id, id));
}

/** Tie a thread to an order, unless it is already tied to one. */
export async function linkOrder(db: DbExecutor, threadId: string, orderId: string): Promise<void> {
  await db
    .update(mailThreads)
    .set({ orderId, updatedAt: new Date() })
    .where(and(eq(mailThreads.id, threadId), isNull(mailThreads.orderId)));
}
