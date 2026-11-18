import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { mailDirectionEnum, mailThreadStatusEnum } from "../enums";
import { orders } from "./orders";

/**
 * One conversation in the shop's mailbox, with one correspondent.
 *
 * Messages to the shop's address arrive through Resend's `email.received` webhook; replies leave
 * from the admin panel as the same address. See packages/mailbox.
 */
export const mailThreads = pgTable(
  "mail_thread",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    subject: text("subject").notNull(),
    /** The other party: the single address their From header named, lowercased. A From that does not
        parse as one mailbox is kept here flattened, and such a thread cannot be replied to. */
    correspondent: text("correspondent").notNull(),
    correspondentName: text("correspondent_name"),
    status: mailThreadStatusEnum("status").default("open").notNull(),
    /** The order the conversation is about: an "Email customer" from the order page, or a customer's
        reply that quotes the order reference from their confirmation email. */
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    lastMessageAt: timestamp("last_message_at", { mode: "date" }).notNull(),
    /** Who spoke last: an open thread whose last message is "in" is waiting for our answer. */
    lastMessageDirection: mailDirectionEnum("last_message_direction").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("mail_thread_last_message_at_idx").on(table.lastMessageAt),
    index("mail_thread_correspondent_idx").on(table.correspondent),
    index("mail_thread_order_idx").on(table.orderId),
  ],
);
