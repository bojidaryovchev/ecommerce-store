/**
 * The mailbox end to end, against a real Postgres and a fake Resend.
 *
 * Needs a disposable, fully migrated database (the mail tables are truncated!):
 *   MAILBOX_TEST_DATABASE_URL=postgres://postgres:devpass@localhost:55432/ecommerce pnpm test
 * Refuses to run against anything but localhost.
 */
import * as schema from "@ecommerce/database/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { mailIdentity } from "../src/compose";
import { recordFormSubmission } from "../src/forms";
import { handleInboundWebhook, type InboundDeps } from "../src/inbound";
import { replyToThread, startThread, UNCLEAR_RECIPIENT } from "../src/outbound";
import { countThreads, getThread, listThreads, ordersForAddress, setThreadStatus } from "../src/store";
import type { MailTransport, OutgoingEmail, ReceivedEmail } from "../src/transport";

const url = process.env.MAILBOX_TEST_DATABASE_URL;
const isLocal = !!url && ["localhost", "127.0.0.1"].includes(new URL(url).hostname);

const SHOP = "contact@shop.example";
const OWNER = "owner@personal.example";
const ORDER_ID = "abcdef12-0000-4000-8000-000000000001";
const ORDER_EMAIL = "ivan@abv.bg";

class FakeResend implements MailTransport {
  received = new Map<string, ReceivedEmail>();
  sent: (OutgoingEmail & { id: string })[] = [];
  verifyWebhook(payload: string, headers: { signature: string }) {
    if (headers.signature !== "valid") throw new Error("signature mismatch");
    return JSON.parse(payload);
  }
  async getReceivedEmail(id: string) {
    const email = this.received.get(id);
    if (!email) throw new Error(`no email ${id}`);
    return email;
  }
  async send(email: OutgoingEmail) {
    const id = `sent-${randomUUID()}`;
    this.sent.push({ ...email, id });
    return { id };
  }
  async sentMessageId(id: string) {
    return `<${id}@resend.test>`;
  }
}

describe.skipIf(!isLocal)("mailbox (integration)", () => {
  const client = postgres(url ?? "postgres://localhost/none", { max: 5, onnotice: () => {} });
  const db = drizzle(client, { schema });
  let resend: FakeResend;
  let deps: InboundDeps;

  /** Resend telling us about a message, and the message itself behind its API. */
  async function receive(email: Partial<ReceivedEmail> & { from: string }, options: { signature?: string } = {}) {
    const id = email.id ?? `in-${randomUUID()}`;
    const full: ReceivedEmail = {
      id,
      to: [SHOP],
      cc: null,
      bcc: null,
      reply_to: null,
      received_for: [SHOP],
      subject: "Въпрос",
      text: "Здравейте",
      html: null,
      headers: {},
      message_id: `<${id}@sender.example>`,
      created_at: new Date().toISOString(),
      attachments: [],
      ...email,
    };
    resend.received.set(id, full);
    const event = {
      type: "email.received",
      created_at: full.created_at,
      data: {
        email_id: id,
        created_at: full.created_at,
        from: full.from,
        to: full.to,
        cc: full.cc ?? [],
        bcc: full.bcc ?? [],
        received_for: full.received_for ?? [],
        message_id: full.message_id,
        subject: full.subject,
      },
    };
    const outcome = await handleInboundWebhook(deps, JSON.stringify(event), {
      id: "msg",
      timestamp: "0",
      signature: options.signature ?? "valid",
    });
    return { id, email: full, outcome };
  }

  const threadIdOf = (outcome: Awaited<ReturnType<typeof receive>>["outcome"]) => {
    if (outcome.status !== "recorded") throw new Error(`expected recorded, got ${JSON.stringify(outcome)}`);
    return outcome.threadId;
  };

  beforeEach(async () => {
    await db.execute(sql`truncate mail_message, mail_thread`);
    await db.delete(schema.orders).where(eq(schema.orders.id, ORDER_ID));
    await db.insert(schema.orders).values({
      id: ORDER_ID,
      guestEmail: ORDER_EMAIL,
      status: "paid",
      currency: "eur",
      subtotalAmount: 10000,
      totalAmount: 10000,
    });
    resend = new FakeResend();
    deps = {
      db,
      transport: resend,
      identity: mailIdentity(`Shop <${SHOP}>`, "https://shop.example")!,
      notifyTo: OWNER,
      threadUrl: (id) => `https://shop.example/admin/mailbox/${id}`,
    };
  });

  afterAll(async () => {
    await db.execute(sql`truncate mail_message, mail_thread`);
    await db.delete(schema.orders).where(inArray(schema.orders.id, [ORDER_ID]));
    await client.end();
  });

  it("records a new message, waits for an answer, and sends the owner a heads-up", async () => {
    const { outcome } = await receive({ from: "Иван Петров <Ivan@ABV.bg>", subject: "Колко струва монтажът?" });
    const threadId = threadIdOf(outcome);
    expect(outcome).toMatchObject({ newThread: true, notified: true });

    const thread = (await getThread(db, threadId))!;
    expect(thread).toMatchObject({ correspondent: "ivan@abv.bg", correspondentName: "Иван Петров", status: "open" });
    expect(await countThreads(db)).toMatchObject({ waiting: 1, open: 1, all: 1 });

    const [copy] = resend.sent;
    expect(copy).toMatchObject({ to: OWNER, replyTo: ["ivan@abv.bg"], subject: "Колко струва монтажът?" });
    expect(copy!.from).toBe(`"Иван Петров via Shop" <${SHOP}>`);
    expect(copy!.text).toContain(`https://shop.example/admin/mailbox/${threadId}`);
  });

  it("records a retried webhook once, even when both deliveries arrive together", async () => {
    const first = await receive({ from: "ivan@abv.bg" });
    const again = await handleInboundWebhook(
      deps,
      JSON.stringify({ type: "email.received", data: { email_id: first.id, from: "ivan@abv.bg", to: [SHOP] } }),
      { id: "x", timestamp: "0", signature: "valid" },
    );
    expect(again).toEqual({ status: "duplicate", messageId: first.id });

    // Two deliveries of a message nobody has recorded yet, at the same moment.
    const id = `in-${randomUUID()}`;
    resend.received.set(id, { ...first.email, id, message_id: `<${id}@x>`, subject: "Нов въпрос" });
    const event = JSON.stringify({ type: "email.received", data: { email_id: id, from: "ivan@abv.bg", to: [SHOP] } });
    const outcomes = await Promise.all([
      handleInboundWebhook(deps, event, { id: "a", timestamp: "0", signature: "valid" }),
      handleInboundWebhook(deps, event, { id: "b", timestamp: "0", signature: "valid" }),
    ]);
    expect(outcomes.map((o) => o.status).sort()).toEqual(["duplicate", "recorded"]);
    expect((await countThreads(db)).all).toBe(2);
  });

  it("ignores what is not ours: other addresses, our own address, other events, bad signatures", async () => {
    expect(
      (await receive({ from: "a@b.example", to: ["sales@shop.example"], received_for: ["sales@shop.example"] }))
        .outcome,
    ).toMatchObject({
      status: "ignored",
    });
    expect((await receive({ from: `Shop <${SHOP}>` })).outcome).toMatchObject({ status: "ignored" });
    expect((await receive({ from: "a@b.example" }, { signature: "forged" })).outcome).toEqual({
      status: "unauthorized",
    });
    const other = await handleInboundWebhook(deps, JSON.stringify({ type: "email.delivered", data: {} }), {
      id: "x",
      timestamp: "0",
      signature: "valid",
    });
    expect(other).toMatchObject({ status: "ignored" });
    expect((await countThreads(db)).all).toBe(0);
  });

  it("answers in the customer's thread, and files their reply under it by References or subject", async () => {
    const first = await receive({ from: "Иван <ivan@abv.bg>", subject: "Въпрос за климатик" });
    const threadId = threadIdOf(first.outcome);

    const reply = await replyToThread(
      { db, transport: resend, identity: deps.identity },
      { threadId, body: "Здравейте, Иван!" },
    );
    expect(reply.ok).toBe(true);
    const answer = resend.sent.at(-1)!;
    expect(answer).toMatchObject({ to: "ivan@abv.bg", subject: "Re: Въпрос за климатик", from: `Shop <${SHOP}>` });
    expect(answer.headers).toEqual({ "In-Reply-To": first.email.message_id, References: first.email.message_id });
    expect((await countThreads(db)).waiting).toBe(0);

    // Their reply quotes their own first message in References (ours has an id they made up for us).
    const second = await receive({
      from: "ivan@abv.bg",
      subject: "RE: Отн: Въпрос за климатик",
      headers: {
        References: `${first.email.message_id} <their-copy-of-ours@abv.bg>`,
        "In-Reply-To": "<their-copy-of-ours@abv.bg>",
      },
    });
    expect(threadIdOf(second.outcome)).toBe(threadId);

    // A fresh message, no headers, same subject: still the same open conversation.
    const third = await receive({ from: "IVAN@abv.bg", subject: "Fwd: въпрос за климатик" });
    expect(threadIdOf(third.outcome)).toBe(threadId);
    expect((await getThread(db, threadId))!.messages.map((m) => m.direction)).toEqual(["in", "out", "in", "in"]);
    expect((await countThreads(db)).waiting).toBe(1);
  });

  it("does not let a forged From join or answer somebody else's conversation", async () => {
    const first = await receive({ from: "ivan@abv.bg", subject: "Поръчка" });
    const threadId = threadIdOf(first.outcome);

    const forged = await receive({
      from: '"<ivan@abv.bg>" <attacker@evil.example>',
      subject: "Re: Поръчка",
      headers: { References: first.email.message_id },
    });
    const forgedThread = threadIdOf(forged.outcome);
    expect(forgedThread).not.toBe(threadId);
    expect((await getThread(db, forgedThread))!.correspondent).toBe("attacker@evil.example");

    await replyToThread({ db, transport: resend, identity: deps.identity }, { threadId: forgedThread, body: "?" });
    expect(resend.sent.at(-1)!.to).toBe("attacker@evil.example");

    // A From with two mailboxes is kept, in a thread nobody can answer from the panel.
    const unclear = await receive({ from: "ivan@abv.bg, attacker@evil.example", subject: "Поръчка" });
    const unclearThread = threadIdOf(unclear.outcome);
    expect(unclearThread).not.toBe(threadId);
    expect(
      await replyToThread({ db, transport: resend, identity: deps.identity }, { threadId: unclearThread, body: "?" }),
    ).toEqual({
      ok: false,
      error: UNCLEAR_RECIPIENT,
    });
  });

  it("ties a reply to the order confirmation to its order, only for the order's own address", async () => {
    const subject = "Re: Order Confirmed — #abcdef12";
    const own = await receive({
      from: "Ivan@ABV.bg",
      subject,
      authentication: { dmarc: "pass" },
    } as Partial<ReceivedEmail> & { from: string });
    expect((await getThread(db, threadIdOf(own.outcome)))!.orderId).toBe(ORDER_ID);

    const stranger = await receive({
      from: "someone@else.example",
      subject,
      authentication: { dmarc: "pass" },
    } as Partial<ReceivedEmail> & {
      from: string;
    });
    expect((await getThread(db, threadIdOf(stranger.outcome)))!.orderId).toBeNull();

    await db.execute(sql`truncate mail_message, mail_thread`);
    const forged = await receive({
      from: ORDER_EMAIL,
      subject,
      authentication: { dmarc: "fail", dkim: "fail" },
    } as Partial<ReceivedEmail> & {
      from: string;
    });
    const forgedThread = (await getThread(db, threadIdOf(forged.outcome)))!;
    expect(forgedThread.orderId).toBeNull();
    expect(forgedThread.messages[0]!.senderVerified).toBe(false);
    expect((await ordersForAddress(db, "IVAN@abv.bg")).map((o) => o.id)).toEqual([ORDER_ID]);
  });

  it("starts a conversation about an order, and their answer joins it; a new message reopens a finished one", async () => {
    const started = await startThread(
      { db, transport: resend, identity: deps.identity },
      { to: ORDER_EMAIL, subject: "Поръчка #abcdef12", body: "Кога да доставим?", orderId: ORDER_ID },
    );
    if (!started.ok) throw new Error(started.error);
    const thread = (await getThread(db, started.threadId))!;
    expect(thread).toMatchObject({ orderId: ORDER_ID, lastMessageDirection: "out", correspondent: ORDER_EMAIL });
    expect(thread.messages[0]!.messageId).toBe(`<${started.messageId}@resend.test>`);

    await setThreadStatus(db, started.threadId, "done");
    const answer = await receive({
      from: ORDER_EMAIL,
      subject: "Re: Поръчка #abcdef12 — друго",
      headers: { "In-Reply-To": `<${started.messageId}@resend.test>` },
    });
    expect(threadIdOf(answer.outcome)).toBe(started.threadId);
    expect((await getThread(db, started.threadId))!.status).toBe("open");

    const { threads } = await listThreads(db, { view: "waiting" });
    expect(threads.map((t) => [t.id, t.messageCount, t.snippet, t.orderReference])).toEqual([
      [started.threadId, 2, "Здравейте", "abcdef12"],
    ]);

    expect(
      await startThread(
        { db, transport: resend, identity: deps.identity },
        { to: "a@b.example, c@d.example", subject: "x", body: "y" },
      ),
    ).toEqual({
      ok: false,
      error: "Enter one email address.",
    });
  });
  it("files a site form as a waiting conversation, acknowledges it without answering it, and threads the reply", async () => {
    const submitted = await recordFormSubmission(db, {
      name: "Мария",
      email: "Maria@ABV.bg",
      subject: "Заявка за оглед: Термопомпа въздух-вода (Пловдив)",
      text: "Къща 140 m², искаме оглед.",
      to: SHOP,
    });
    if ("error" in submitted) throw new Error(submitted.error);
    expect((await getThread(db, submitted.threadId))!).toMatchObject({
      correspondent: "maria@abv.bg",
      correspondentName: "Мария",
    });

    const ack = await replyToThread(
      { db, transport: resend, identity: deps.identity },
      { threadId: submitted.threadId, body: "Получихме заявката ви.", keepWaiting: true },
    );
    if (!ack.ok) throw new Error(ack.error);
    expect((await countThreads(db)).waiting).toBe(1);

    const answer = await receive({
      from: "maria@abv.bg",
      subject: "Re: Заявка за оглед: Термопомпа въздух-вода (Пловдив)",
      headers: { "In-Reply-To": `<${ack.messageId}@resend.test>` },
    });
    expect(threadIdOf(answer.outcome)).toBe(submitted.threadId);
    expect(
      await recordFormSubmission(db, { name: "x", email: "not an address", subject: "s", text: "t", to: SHOP }),
    ).toEqual({
      error: "invalid-email",
    });
  });
});
