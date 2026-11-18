import { sql } from "drizzle-orm";
import { hasAddresses, isAddressedTo, sameAddress, singleMailbox, type Mailbox } from "./address";
import { authenticationOf, senderVerdict } from "./authentication";
import { composeNotification, type MailIdentity } from "./compose";
import { addMessage, createThread, findOrderByReference, getMessage, matchThread } from "./store";
import { headerValue, orderReferences, parseMessageIds } from "./subject";
import { htmlToText } from "./text";
import type { MailTransport, ReceivedEmail, ReceivedEmailEvent, WebhookHeaders } from "./transport";
import type { Database } from "./types";

/**
 * Incoming mail: Resend's `email.received` webhook → the database → (optionally) a heads-up copy in the
 * owner's own inbox.
 *
 * Recorded first, and for a reason: the record is what lets the conversation be answered from the admin
 * panel as the shop's address. A heads-up that fails costs a notification; a record that never happens
 * costs the conversation.
 *
 * Webhooks carry metadata only, no body: the message itself is a second call to the Received Emails API.
 */

export type InboundDeps = {
  db: Database;
  transport: MailTransport;
  identity: MailIdentity;
  /** The owner's own inbox, for a heads-up copy of each new message. Null to skip. */
  notifyTo?: string | null;
  /** The admin page of a conversation, linked from the heads-up copy. */
  threadUrl?: (threadId: string) => string;
};

export type InboundOutcome =
  | {
      status: "recorded";
      threadId: string;
      messageId: string;
      newThread: boolean;
      notified: boolean;
      notifyError?: string;
    }
  /** Already recorded: Resend retried the webhook. */
  | { status: "duplicate"; messageId: string }
  /** Understood and deliberately not recorded. Answered 200, since a retry would decide the same. */
  | { status: "ignored"; reason: string }
  | { status: "unauthorized" }
  /** Our side or Resend's broke. Answered 500 so Resend retries instead of dropping a customer's mail. */
  | { status: "failed"; error: string };

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Resend's timestamps, whichever way they are written ("2026-11-18T10:00:00.000Z" or
 *  "2026-11-18 10:00:00.123456+00"); now, when neither. */
export function parseTimestamp(value: string | null | undefined): Date {
  if (value) {
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct;
    const normalized = value
      .trim()
      .replace(" ", "T")
      .replace(/(\.\d{3})\d+/, "$1")
      .replace(/([+-]\d{2})$/, "$1:00");
    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/** A display name that cannot break a From header: header syntax taken out of a stranger's string. */
const headerSafe = (value: string): string =>
  value
    .replace(/[<>"\\,;:\r\n]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

/** What a thread whose From does not parse is listed under: the header itself, flattened, so the admin
 *  can see what arrived. Never matched against, never replied to. */
const unparsedCorrespondent = (from: string): string =>
  from
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200) || "(no sender)";

export type RecordResult = { threadId: string; created: boolean; newThread: boolean };

/**
 * File an incoming message in the mailbox.
 *
 * The sender is the ONE mailbox the From header names, parsed (see address.ts). A From that names none,
 * several, or that does not parse is still recorded, in a thread of its own that joins no conversation,
 * is tied to no order and cannot be answered from the panel.
 *
 * A new conversation whose subject quotes an order reference ("Re: Поръчка #7A1FFAB1 е потвърдена") is tied
 * to that order when the order was placed with the sender's address, unless the receiving server said
 * the From address was forged.
 */
export async function recordInboundEmail(db: Database, email: ReceivedEmail): Promise<RecordResult> {
  const sender = singleMailbox(email.from);
  const subject = email.subject?.trim() || "(no subject)";
  const references = [
    ...parseMessageIds(headerValue(email.headers, "in-reply-to")),
    ...parseMessageIds(headerValue(email.headers, "references")),
  ];
  const verdict = sender ? senderVerdict(sender.address, authenticationOf(email), email.headers) : null;
  const receivedAt = parseTimestamp(email.created_at);
  const attachments = (email.attachments ?? []).map((item) => ({
    id: item.id,
    filename: item.filename || "attachment",
    size: item.size,
    contentType: item.content_type,
  }));
  const from = sender ? sender.address : unparsedCorrespondent(email.from);

  return db.transaction(async (tx) => {
    // Resend can deliver the same webhook twice at once; the lock makes one of them a no-op.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${email.id}))`);
    const existing = await getMessage(tx, email.id);
    if (existing) return { threadId: existing.threadId, created: false, newThread: false };

    let threadId = sender ? await matchThread(tx, references, sender.address, subject) : null;
    const newThread = !threadId;
    if (!threadId) {
      const orderId =
        sender && verdict !== false ? await findOrderByReference(tx, orderReferences(subject), sender.address) : null;
      threadId = await createThread(tx, {
        subject,
        correspondent: from,
        correspondentName: sender?.name ?? null,
        orderId,
        createdAt: receivedAt,
        direction: "in",
      });
    }

    await addMessage(tx, {
      id: email.id,
      threadId,
      direction: "in",
      fromAddress: from,
      fromName: sender?.name ?? null,
      toAddresses: email.to.join(", "),
      ccAddresses: email.cc?.length ? email.cc.join(", ") : null,
      subject,
      bodyText: email.text,
      bodyHtml: email.html,
      messageId: email.message_id || null,
      inReplyTo: headerValue(email.headers, "in-reply-to") ?? null,
      attachments: attachments.length > 0 ? attachments : null,
      senderVerified: verdict,
      createdAt: receivedAt,
    });
    return { threadId, created: true, newThread };
  });
}

export async function handleInboundWebhook(
  deps: InboundDeps,
  /** The raw request body, byte for byte: the signature covers the exact bytes. */
  payload: string,
  headers: WebhookHeaders,
): Promise<InboundOutcome> {
  let event;
  try {
    event = deps.transport.verifyWebhook(payload, headers);
  } catch {
    return { status: "unauthorized" };
  }
  if (event.type !== "email.received") return { status: "ignored", reason: `event ${event.type}` };

  const data = (event as ReceivedEmailEvent).data;
  const own = deps.identity.address;

  /* Our own address writing to itself: a copy of something we sent, or a forwarding loop through the
     owner's inbox. Recording or notifying it starts a ping-pong. */
  const claimed: Mailbox | null = singleMailbox(data.from);
  if (claimed && sameAddress(claimed.address, own)) {
    return { status: "ignored", reason: "sent from the mailbox's own address" };
  }

  /* The Resend account may receive for other addresses and domains too, and fires this webhook for all
     of them. Only mail to the shop's address belongs here; the rest is somebody else's correspondence.
     The event carries the recipients, so this costs no API call. */
  const eventRecipients = [data.to, data.cc, data.bcc, data.received_for];
  const eventNamesRecipients = hasAddresses(eventRecipients);
  if (eventNamesRecipients && !isAddressedTo(eventRecipients, own)) {
    return { status: "ignored", reason: `not addressed to ${own}` };
  }

  if (await getMessage(deps.db, data.email_id)) return { status: "duplicate", messageId: data.email_id };

  let email: ReceivedEmail;
  try {
    email = await deps.transport.getReceivedEmail(data.email_id);
  } catch (error) {
    return { status: "failed", error: `fetching the message failed: ${errorMessage(error)}` };
  }

  if (!eventNamesRecipients && !isAddressedTo([email.to, email.cc, email.bcc, email.received_for], own)) {
    return { status: "ignored", reason: `not addressed to ${own}` };
  }

  let recorded: RecordResult;
  try {
    recorded = await recordInboundEmail(deps.db, email);
  } catch (error) {
    return { status: "failed", error: `recording the message failed: ${errorMessage(error)}` };
  }
  if (!recorded.created) return { status: "duplicate", messageId: email.id };

  /* From here on it is only the heads-up. The message is already in the panel, so a failure is reported
     and shrugged off rather than turned into a 500 and an endless retry. */
  const notifyTo = deps.notifyTo?.trim();
  let notified = false;
  let notifyError: string | undefined;
  // The owner's inbox being the shop's own address would be a loop with a rate limit at the end of it.
  if (notifyTo && !sameAddress(notifyTo, own)) {
    const sender = singleMailbox(email.from);
    const copy = composeNotification(
      deps.identity,
      {
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text?.trim() || (email.html ? htmlToText(email.html) : ""),
        receivedAt: parseTimestamp(email.created_at),
        attachments: (email.attachments ?? []).map((a) => a.filename || "attachment"),
        senderVerified: sender ? senderVerdict(sender.address, authenticationOf(email), email.headers) : null,
      },
      deps.threadUrl?.(recorded.threadId) ?? null,
    );
    const name = headerSafe(sender ? (sender.name ?? sender.address) : email.from) || "Unknown sender";
    try {
      await deps.transport.send({
        from: `"${name} via ${headerSafe(deps.identity.name)}" <${own}>`,
        to: notifyTo,
        subject: copy.subject,
        text: copy.text,
        html: copy.html,
        replyTo: email.reply_to?.length ? email.reply_to : sender ? [sender.address] : undefined,
      });
      notified = true;
    } catch (error) {
      notifyError = errorMessage(error);
    }
  }

  return {
    status: "recorded",
    threadId: recorded.threadId,
    messageId: email.id,
    newThread: recorded.newThread,
    notified,
    ...(notifyError ? { notifyError } : {}),
  };
}
