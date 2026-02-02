import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { refundReasonEnum, refundStatusEnum } from "../enums";
import { charges } from "./charges";
import { orders } from "./orders";
import { paymentIntents } from "./payment-intents";

export const refunds = pgTable("refund", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeRefundId: text("stripe_refund_id").unique(),
  object: text("object").default("refund"),
  chargeId: text("charge_id").references(() => charges.id, { onDelete: "set null" }),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: refundStatusEnum("status").default("pending").notNull(),
  reason: refundReasonEnum("reason"),
  description: text("description"),
  failureReason: text("failure_reason"),
  receiptNumber: text("receipt_number"),
  balanceTransactionId: text("balance_transaction_id"),
  nextAction: jsonb("next_action").$type<Record<string, unknown>>(),
  destinationDetails: jsonb("destination_details").$type<Record<string, unknown>>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
