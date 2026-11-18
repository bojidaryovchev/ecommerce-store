import { SITE_URL } from "@/lib/site-url";
import {
  ATTACHMENT_LIMIT,
  mailIdentity,
  type MailIdentity,
  type MailTransport,
  type OutgoingAttachment,
  type WebhookEvent,
} from "@ecommerce/mailbox";
import { Resend } from "resend";

/**
 * The shop's mailbox, wired to Resend. The logic lives in packages/mailbox; this is configuration.
 *
 *   EMAIL_FROM             "Shop <contact@example.com>": the mailbox's address. Every email leaves from it,
 *                          and mail to it lands in /admin/mailbox.
 *   RESEND_API_KEY         Needs full access: receiving mail means reading it back from Resend.
 *   RESEND_WEBHOOK_SECRET  Signing secret of the Resend webhook (email.received → /api/webhooks/resend).
 *   MAIL_TO                Optional: the owner's own inbox, for a heads-up copy of each new message.
 */

/** Who the shop's mail is from. Null when EMAIL_FROM does not name exactly one address. */
export function getMailIdentity(): MailIdentity | null {
  return mailIdentity(process.env.EMAIL_FROM, SITE_URL);
}

export const mailboxThreadUrl = (threadId: string) => `${SITE_URL}/admin/mailbox/${threadId}`;

let client: Resend | null = null;
function resend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client ??= new Resend(key);
  return client;
}

const failure = (error: { message?: string } | null | undefined, fallback: string) =>
  new Error(error?.message ?? fallback);

export function getMailTransport(): MailTransport | null {
  const api = resend();
  if (!api) return null;
  return {
    verifyWebhook(payload, headers) {
      const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
      if (!webhookSecret) throw new Error("RESEND_WEBHOOK_SECRET is not set");
      return api.webhooks.verify({ payload, headers, webhookSecret }) as WebhookEvent;
    },
    async getReceivedEmail(emailId) {
      // "cid" keeps inline images as references instead of inlining them into the stored HTML as base64.
      const { data, error } = await api.emails.receiving.get(emailId, { html_format: "cid" });
      if (error || !data) throw failure(error, "Resend returned no email");
      return data;
    },
    async send(email) {
      const { data, error } = await api.emails.send({
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
        ...(email.replyTo ? { replyTo: email.replyTo } : {}),
        ...(email.headers ? { headers: email.headers } : {}),
        ...(email.attachments
          ? {
              attachments: email.attachments.map((file) => ({
                filename: file.filename,
                content: file.content,
                contentType: file.contentType,
              })),
            }
          : {}),
      });
      if (error || !data) throw failure(error, "Resend accepted nothing");
      return { id: data.id };
    },
    async sentMessageId(emailId) {
      // Resend hands the message to its mail servers, and gets the Message-ID back, about half a
      // second after `send` returns; asked at once, it has none yet.
      for (const wait of [400, 700, 1200]) {
        await new Promise((resolve) => setTimeout(resolve, wait));
        const { data } = await api.emails.get(emailId);
        if (data?.message_id) return data.message_id;
      }
      return null;
    },
  };
}

/** Everything sending needs, or null when email is not configured. */
export function getMailDeps() {
  const identity = getMailIdentity();
  const transport = getMailTransport();
  return identity && transport ? { identity, transport } : null;
}

/** The files of a form's `files` input, base64-encoded, or an error when they are too large to send. */
export async function readAttachments(formData: FormData): Promise<OutgoingAttachment[] | { error: string }> {
  const files: OutgoingAttachment[] = [];
  let total = 0;
  for (const entry of formData.getAll("files")) {
    // An empty file input still submits a zero-byte File.
    if (!(entry instanceof File) || entry.size === 0) continue;
    total += entry.size;
    if (total > ATTACHMENT_LIMIT) {
      return {
        error: `Attachments add up to more than ${Math.round(ATTACHMENT_LIMIT / 1_000_000)} MB. Send a download link instead.`,
      };
    }
    files.push({
      filename: entry.name,
      contentType: entry.type || "application/octet-stream",
      content: Buffer.from(await entry.arrayBuffer()).toString("base64"),
      size: entry.size,
    });
  }
  return files;
}

/**
 * A fresh download link for an attachment. Resend hands out signed, expiring URLs, so a link stored at
 * receipt would be dead by the time anyone clicks it; and since it is bearer-shaped, it is only ever
 * fetched server-side, behind the admin session.
 */
export async function attachmentDownload(
  direction: "in" | "out",
  emailId: string,
  attachment: { id?: string; filename: string; contentType: string } | undefined,
  index: number,
): Promise<{ url: string; filename: string; contentType: string } | null> {
  const api = resend();
  if (!api) return null;
  const endpoint = direction === "in" ? api.emails.receiving.attachments : api.emails.attachments;

  if (attachment?.id) {
    const { data } = await endpoint.get({ emailId, id: attachment.id });
    if (data)
      return { url: data.download_url, filename: data.filename ?? attachment.filename, contentType: data.content_type };
  }
  // Mail we sent has no stored attachment ids; Resend lists its attachments in the order they were sent.
  const { data } = await endpoint.list({ emailId });
  const item = data?.data?.[index];
  if (!item) return null;
  return {
    url: item.download_url,
    filename: item.filename ?? attachment?.filename ?? "attachment",
    contentType: item.content_type,
  };
}
