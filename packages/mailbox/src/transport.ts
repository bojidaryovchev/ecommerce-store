/**
 * What the mailbox needs from the mail provider. The web app implements it with the Resend SDK
 * (apps/web/src/lib/mailbox.ts); tests use a fake. The shapes are the subset of Resend's we read.
 */

export type WebhookHeaders = { id: string; timestamp: string; signature: string };

export type ReceivedEmailEvent = {
  type: "email.received";
  created_at: string;
  data: {
    email_id: string;
    created_at: string;
    from: string;
    to: string[];
    cc?: string[] | null;
    bcc?: string[] | null;
    received_for?: string[] | null;
    message_id: string;
    subject: string;
  };
};

/** Any verified event. Only `email.received` is acted on; the rest are acknowledged and ignored. */
export type WebhookEvent = ReceivedEmailEvent | { type: string; data?: unknown };

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  cc: string[] | null;
  bcc: string[] | null;
  reply_to: string[] | null;
  received_for?: string[] | null;
  subject: string;
  text: string | null;
  html: string | null;
  headers: Record<string, string> | null;
  message_id: string;
  created_at: string;
  attachments?: { id: string; filename: string | null; size: number; content_type: string }[] | null;
  /** SPF/DKIM/DMARC verdicts from the receiving server, when reported. See authentication.ts. */
  authentication?: unknown;
};

export type OutgoingAttachment = {
  filename: string;
  contentType: string;
  /** Base64. */
  content: string;
  size: number;
};

export type OutgoingEmail = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string[];
  headers?: Record<string, string>;
  attachments?: OutgoingAttachment[];
};

export interface MailTransport {
  /** Throws when the signature does not match. */
  verifyWebhook(payload: string, headers: WebhookHeaders): WebhookEvent;
  getReceivedEmail(emailId: string): Promise<ReceivedEmail>;
  /** Returns the provider's id for the sent message. Throws when the provider refuses it. */
  send(email: OutgoingEmail): Promise<{ id: string }>;
  /** The RFC 5322 Message-ID the provider gave a message we sent, when it can tell. */
  sentMessageId?(emailId: string): Promise<string | null>;
}
