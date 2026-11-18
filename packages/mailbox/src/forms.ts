import { randomUUID } from "node:crypto";
import { singleMailbox } from "./address";
import { addMessage, createThread } from "./store";
import type { Database } from "./types";

/**
 * A message written in a form on the site (contact, site-visit request): filed in the mailbox as an
 * incoming message from the address the visitor typed, so it is answered from the panel like any
 * email, and the visitor's reply to that answer joins the same conversation.
 *
 * The address is only what the visitor typed; nothing vouches for it. `senderVerified` stays null.
 */
export async function recordFormSubmission(
  db: Database,
  input: {
    name: string;
    email: string;
    subject: string;
    text: string;
    /** The shop's address, recorded as the recipient. */
    to: string;
    /** An order the form is about, already checked to belong to this address. */
    orderId?: string | null;
    createdAt?: Date;
  },
): Promise<{ threadId: string; messageId: string } | { error: "invalid-email" }> {
  const mailbox = singleMailbox(input.email.trim());
  if (!mailbox) return { error: "invalid-email" };
  const createdAt = input.createdAt ?? new Date();
  const name = input.name.trim() || null;
  const messageId = `form-${randomUUID()}`;

  const threadId = await db.transaction(async (tx) => {
    const id = await createThread(tx, {
      subject: input.subject,
      correspondent: mailbox.address,
      correspondentName: name,
      orderId: input.orderId ?? null,
      createdAt,
      direction: "in",
    });
    await addMessage(tx, {
      id: messageId,
      threadId: id,
      direction: "in",
      fromAddress: mailbox.address,
      fromName: name,
      toAddresses: input.to,
      subject: input.subject,
      bodyText: input.text,
      bodyHtml: null,
      messageId: null,
      inReplyTo: null,
      attachments: null,
      senderVerified: null,
      createdAt,
    });
    return id;
  });
  return { threadId, messageId };
}
