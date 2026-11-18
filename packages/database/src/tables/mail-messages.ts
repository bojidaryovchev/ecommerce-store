import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { mailDirectionEnum } from "../enums";
import { mailThreads } from "./mail-threads";
import { users } from "./users";

/** What we keep about an attachment. The bytes stay with Resend and are fetched on download. */
export type MailAttachment = {
  /** Resend's attachment id (received mail); absent for mail we sent, which is found by position. */
  id?: string;
  filename: string;
  size: number;
  contentType: string;
};

export const mailMessages = pgTable(
  "mail_message",
  {
    /** Resend's id: the received-email id for incoming mail, the sent-email id for ours. Also what makes
        a retried webhook a no-op. */
    id: text("id").primaryKey(),
    threadId: text("thread_id")
      .notNull()
      .references(() => mailThreads.id, { onDelete: "cascade" }),
    direction: mailDirectionEnum("direction").notNull(),
    fromAddress: text("from_address").notNull(),
    fromName: text("from_name"),
    toAddresses: text("to_addresses").notNull(),
    ccAddresses: text("cc_addresses"),
    subject: text("subject").notNull(),
    bodyText: text("body_text"),
    bodyHtml: text("body_html"),
    /** RFC 5322 Message-ID and In-Reply-To: what threads a reply in the customer's mail client, and
        what files their next reply under this conversation. */
    messageId: text("message_id"),
    inReplyTo: text("in_reply_to"),
    attachments: jsonb("attachments").$type<MailAttachment[]>(),
    /** Incoming mail: whether the receiving server vouched for the From address (DMARC, or one aligned
        DKIM signature). Null when it did not say. */
    senderVerified: boolean("sender_verified"),
    /** Outgoing mail: the admin who sent it. */
    sentBy: text("sent_by").references(() => users.id, { onDelete: "set null" }),
    /** When it was received or sent. */
    createdAt: timestamp("created_at", { mode: "date" }).notNull(),
  },
  (table) => [
    index("mail_message_thread_created_idx").on(table.threadId, table.createdAt),
    index("mail_message_message_id_idx").on(table.messageId),
  ],
);
