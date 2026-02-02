import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  customerTaxExemptEnum,
  invoiceBillingReasonEnum,
  invoiceStatusEnum,
  subscriptionCollectionMethodEnum,
} from "../enums";
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
  // Account & Customer Info
  accountCountry: text("account_country"),
  accountName: text("account_name"),
  accountTaxIds: text("account_tax_ids").array(),
  customerAddress: jsonb("customer_address").$type<{
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>(),
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  customerShipping: jsonb("customer_shipping").$type<{
    name?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }>(),
  customerTaxExempt: customerTaxExemptEnum("customer_tax_exempt"),
  customerTaxIds: text("customer_tax_ids").array(),
  // Amount Fields
  amountOverpaid: integer("amount_overpaid").default(0),
  amountShipping: integer("amount_shipping").default(0),
  endingBalance: integer("ending_balance"),
  startingBalance: integer("starting_balance").default(0),
  subtotalExcludingTax: integer("subtotal_excluding_tax"),
  totalExcludingTax: integer("total_excluding_tax"),
  postPaymentCreditNotesAmount: integer("post_payment_credit_notes_amount").default(0),
  prePaymentCreditNotesAmount: integer("pre_payment_credit_notes_amount").default(0),
  // Configuration & Display
  customFields: jsonb("custom_fields").$type<
    Array<{
      name?: string;
      value?: string;
    }>
  >(),
  footer: text("footer"),
  rendering: jsonb("rendering").$type<{
    amountTaxDisplay?: string;
    pdf?: {
      pageSize?: string;
    };
  }>(),
  shippingCost: jsonb("shipping_cost").$type<{
    amountSubtotal?: number;
    amountTax?: number;
    amountTotal?: number;
    shippingRate?: string;
  }>(),
  shippingDetails: jsonb("shipping_details").$type<{
    name?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  }>(),
  statementDescriptor: text("statement_descriptor"),
  // Connect Platform Fields
  application: text("application"),
  issuer: jsonb("issuer").$type<{
    account?: string;
    type?: string;
  }>(),
  onBehalfOf: text("on_behalf_of"),
  // Other Important Fields
  attemptCount: integer("attempt_count").default(0),
  automaticallyFinalizesAt: timestamp("automatically_finalizes_at"),
  defaultSource: text("default_source"),
  effectiveAt: timestamp("effective_at"),
  fromInvoice: jsonb("from_invoice").$type<{
    action?: string;
    invoice?: string;
  }>(),
  lastFinalizationError: jsonb("last_finalization_error").$type<{
    code?: string;
    message?: string;
    param?: string;
    type?: string;
  }>(),
  latestRevision: text("latest_revision"),
  parent: jsonb("parent").$type<{
    id?: string;
    object?: string;
  }>(),
  paymentSettings: jsonb("payment_settings").$type<{
    defaultMandate?: string;
    paymentMethodOptions?: Record<string, unknown>;
    paymentMethodTypes?: string[];
  }>(),
  payments: jsonb("payments").$type<{
    data?: Array<{ id?: string; amount?: number }>;
  }>(),
  receiptNumber: text("receipt_number"),
  statusTransitions: jsonb("status_transitions").$type<{
    finalizedAt?: number;
    markedUncollectibleAt?: number;
    paidAt?: number;
    voidedAt?: number;
  }>(),
  testClock: text("test_clock"),
  thresholdReason: jsonb("threshold_reason").$type<{
    amountGte?: number;
    itemReasons?: Array<{
      lineItemIds?: string[];
      usageGte?: number;
    }>;
  }>(),
  totalDiscountAmounts: jsonb("total_discount_amounts").$type<
    Array<{
      amount?: number;
      discount?: string;
    }>
  >(),
  totalPretaxCreditAmounts: jsonb("total_pretax_credit_amounts").$type<
    Array<{
      amount?: number;
      creditNote?: string;
    }>
  >(),
  totalTaxes: jsonb("total_taxes").$type<
    Array<{
      amount?: number;
      inclusive?: boolean;
      taxRate?: string;
    }>
  >(),
  webhooksDeliveredAt: timestamp("webhooks_delivered_at"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
