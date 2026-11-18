import { sameAddress, singleMailbox } from "./address";
import { composeMessage, type MailIdentity } from "./compose";
import { addMessage, createThread, getThread, markWaiting } from "./store";
import { referenceChain, replySubject } from "./subject";
import type { MailTransport, OutgoingAttachment } from "./transport";
import type { Database } from "./types";

/**
 * Mail from the shop's address, sent from the admin panel.
 *
 * This is what a forward to a personal inbox cannot do: pressing Reply there answers from the personal
 * address. Sent from here it leaves as the shop, signed by the shop's DKIM. In-Reply-To and References
 * put the answer inside the customer's existing conversation, and carrying the chain is also what files
 * their next reply under this thread (see `matchThread`).
 *
 * Each message is recorded after Resend accepts it, not before: a reply missing from the transcript
 * shows up in the customer's next message, an unsent one in the transcript misleads forever.
 */

export type OutboundDeps = {
  db: Database;
  transport: MailTransport;
  identity: MailIdentity;
};

export type SendResult = { ok: true; threadId: string; messageId: string } | { ok: false; error: string };

/** Vercel refuses a request body over about 4.5 MB before any code runs, so that, not Resend's 40 MB, is
 *  the honest limit for files attached in the admin panel. */
export const ATTACHMENT_LIMIT = 4_000_000;

/** Said when a conversation's sender is not one address we can read. */
export const UNCLEAR_RECIPIENT =
  "The sender of this conversation is not one clear address, so it cannot be answered from here. Reply from your own mail client.";

const fail = (error: string): SendResult => ({ ok: false, error });

function checkAttachments(attachments: OutgoingAttachment[]): string | null {
  const total = attachments.reduce((sum, file) => sum + file.size, 0);
  return total > ATTACHMENT_LIMIT
    ? `Attachments add up to more than ${Math.round(ATTACHMENT_LIMIT / 1_000_000)} MB. Send a download link instead.`
    : null;
}

async function deliver(
  deps: OutboundDeps,
  message: {
    to: string;
    subject: string;
    body: string;
    headers: Record<string, string>;
    attachments: OutgoingAttachment[];
  },
): Promise<{ id: string; messageId: string | null; text: string; at: Date }> {
  const { text, html } = composeMessage(deps.identity, message.body);
  const { id } = await deps.transport.send({
    from: deps.identity.from,
    to: message.to,
    subject: message.subject,
    text,
    html,
    ...(Object.keys(message.headers).length > 0 ? { headers: message.headers } : {}),
    ...(message.attachments.length > 0 ? { attachments: message.attachments } : {}),
  });
  /* Resend mints the Message-ID; asking for it back lets a reply to a conversation WE started thread by
     its References too. Best effort: the subject still matches it. */
  const messageId = (await deps.transport.sentMessageId?.(id).catch(() => null)) ?? null;
  return { id, messageId, text, at: new Date() };
}

const attachmentMeta = (attachments: OutgoingAttachment[]) =>
  attachments.length > 0
    ? attachments.map((file) => ({ filename: file.filename, size: file.size, contentType: file.contentType }))
    : null;

/** Answer a conversation, to its correspondent, in the customer's existing thread. */
export async function replyToThread(
  deps: OutboundDeps,
  input: {
    threadId: string;
    body: string;
    attachments?: OutgoingAttachment[];
    sentBy?: string | null;
    /** An automatic acknowledgement: the conversation stays "waiting for reply". */
    keepWaiting?: boolean;
  },
): Promise<SendResult> {
  const body = input.body.trim();
  const attachments = input.attachments ?? [];
  if (!body) return fail("The message is empty.");
  const tooLarge = checkAttachments(attachments);
  if (tooLarge) return fail(tooLarge);

  const thread = await getThread(deps.db, input.threadId);
  if (!thread) return fail("Conversation not found.");

  /* ONE PARSED ADDRESS, NEVER A HEADER. The recipient is the thread's correspondent, stored as the single
     mailbox its first message's From named, and never the From of the latest message, which is free text
     a stranger writes. */
  const recipient = singleMailbox(thread.correspondent);
  if (!recipient) return fail(UNCLEAR_RECIPIENT);

  // Thread on the last thing they sent; in a conversation we started, on our last message.
  const parent =
    [...thread.messages].reverse().find((m) => m.direction === "in" && m.messageId) ??
    [...thread.messages].reverse().find((m) => m.messageId);
  const references = referenceChain(thread.messages);
  const headers: Record<string, string> = {};
  if (parent?.messageId) headers["In-Reply-To"] = parent.messageId;
  if (references.length > 0) headers.References = references.join(" ");
  const subject = replySubject(thread.subject);

  let sent;
  try {
    sent = await deliver(deps, { to: recipient.address, subject, body, headers, attachments });
  } catch (error) {
    console.error("[mailbox] Reply not sent:", error);
    return fail("The reply was not sent. Try again in a minute.");
  }

  await addMessage(deps.db, {
    id: sent.id,
    threadId: thread.id,
    direction: "out",
    fromAddress: deps.identity.address,
    fromName: deps.identity.name,
    toAddresses: recipient.address,
    subject,
    bodyText: sent.text,
    bodyHtml: null,
    messageId: sent.messageId,
    inReplyTo: parent?.messageId ?? null,
    attachments: attachmentMeta(attachments),
    sentBy: input.sentBy ?? null,
    createdAt: sent.at,
  });
  if (input.keepWaiting) await markWaiting(deps.db, thread.id);
  return { ok: true, threadId: thread.id, messageId: sent.id };
}

/** Write to someone first: a new conversation, optionally about an order. */
export async function startThread(
  deps: OutboundDeps,
  input: {
    to: string;
    subject: string;
    body: string;
    attachments?: OutgoingAttachment[];
    orderId?: string | null;
    correspondentName?: string | null;
    sentBy?: string | null;
  },
): Promise<SendResult> {
  const recipient = singleMailbox(input.to.trim());
  if (!recipient) return fail("Enter one email address.");
  if (sameAddress(recipient.address, deps.identity.address)) return fail("That is the shop's own address.");
  const subject = input.subject.trim();
  if (!subject) return fail("The subject is empty.");
  const body = input.body.trim();
  if (!body) return fail("The message is empty.");
  const attachments = input.attachments ?? [];
  const tooLarge = checkAttachments(attachments);
  if (tooLarge) return fail(tooLarge);

  let sent;
  try {
    sent = await deliver(deps, { to: recipient.address, subject, body, headers: {}, attachments });
  } catch (error) {
    console.error("[mailbox] Message not sent:", error);
    return fail("The message was not sent. Try again in a minute.");
  }

  const threadId = await deps.db.transaction(async (tx) => {
    const id = await createThread(tx, {
      subject,
      correspondent: recipient.address,
      correspondentName: input.correspondentName?.trim() || recipient.name,
      orderId: input.orderId ?? null,
      createdAt: sent.at,
      direction: "out",
    });
    await addMessage(tx, {
      id: sent.id,
      threadId: id,
      direction: "out",
      fromAddress: deps.identity.address,
      fromName: deps.identity.name,
      toAddresses: recipient.address,
      subject,
      bodyText: sent.text,
      bodyHtml: null,
      messageId: sent.messageId,
      inReplyTo: null,
      attachments: attachmentMeta(attachments),
      sentBy: input.sentBy ?? null,
      createdAt: sent.at,
    });
    return id;
  });
  return { ok: true, threadId, messageId: sent.id };
}
