import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { invoiceBillingReasonEnum, invoiceStatusEnum, subscriptionCollectionMethodEnum } from "../enums";
import { customers } from "./customers";
import { paymentIntents } from "./payment-intents";
import { subscriptions } from "./subscriptions";

export const invoices = pgTable("invoice", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeInvoiceId: text("stripe_invoice_id").unique().notNull(),
  object: text("object").default("invoice"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  status: invoiceStatusEnum("status").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  autoAdvance: boolean("auto_advance").default(true),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
    status?: string;
  }>(),
  collectionMethod: subscriptionCollectionMethodEnum("collection_method").default("charge_automatically"),
  hostedInvoiceUrl: text("hosted_invoice_url"),
  invoicePdf: text("invoice_pdf"),
  number: text("number"),
  lines: jsonb("lines").$type<{
    data?: Array<{
      id?: string;
      amount?: number;
      description?: string;
      quantity?: number;
    }>;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  periodStart: timestamp("period_start", { mode: "date" }),
  periodEnd: timestamp("period_end", { mode: "date" }),
  total: integer("total").notNull(),
  amountDue: integer("amount_due").notNull(),
  amountPaid: integer("amount_paid").default(0),
  amountRemaining: integer("amount_remaining").notNull(),
  subtotal: integer("subtotal").notNull(),
  defaultPaymentMethodId: text("default_payment_method_id"),
  customerAccount: text("customer_account"),
  billingReason: invoiceBillingReasonEnum("billing_reason"),
  dueDate: timestamp("due_date", { mode: "date" }),
  nextPaymentAttempt: timestamp("next_payment_attempt", { mode: "date" }),
  livemode: boolean("livemode").default(false).notNull(),
  confirmationSecret: jsonb("confirmation_secret").$type<{
    id?: string;
    secret?: string;
  }>(),
  attempted: boolean("attempted").default(false),
  discounts: text("discounts").array(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
