import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { refundReasonEnum, refundStatusEnum } from "../enums";
import { orders } from "./orders";

export const refunds = pgTable("refund", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeRefundId: text("stripe_refund_id").unique(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  status: refundStatusEnum("status").default("pending").notNull(),
  reason: refundReasonEnum("reason"),
  description: text("description"),
  failureReason: text("failure_reason"),
  receiptNumber: text("receipt_number"),
  destinationDetails: jsonb("destination_details").$type<Record<string, unknown>>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
