import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { subscriptionCollectionMethodEnum, subscriptionStatusEnum } from "../enums";
import { customers } from "./customers";

export const subscriptions = pgTable("subscription", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeSubscriptionId: text("stripe_subscription_id").unique().notNull(),
  object: text("object").default("subscription"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
  }>(),
  items: jsonb("items").$type<{
    data?: Array<{
      id?: string;
      price?: { id?: string; product?: string };
      quantity?: number;
    }>;
  }>(),
  billingMode: jsonb("billing_mode").$type<{
    paymentMethod?: string;
  }>(),
  billingCycleAnchor: timestamp("billing_cycle_anchor", { mode: "date" }),
  collectionMethod: subscriptionCollectionMethodEnum("collection_method").default("charge_automatically"),
  currentPeriodStart: timestamp("current_period_start", { mode: "date" }),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  trialStart: timestamp("trial_start", { mode: "date" }),
  trialEnd: timestamp("trial_end", { mode: "date" }),
  canceledAt: timestamp("canceled_at", { mode: "date" }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  cancelAt: timestamp("cancel_at", { mode: "date" }),
  endedAt: timestamp("ended_at", { mode: "date" }),
  latestInvoiceId: text("latest_invoice_id"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  pendingSetupIntentId: text("pending_setup_intent_id"),
  pendingUpdate: jsonb("pending_update").$type<{
    billingCycleAnchor?: number;
    expiresAt?: number;
    subscriptionItems?: Array<{
      id?: string;
      price?: string;
      quantity?: number;
    }>;
    trialEnd?: number;
    trialFromPlan?: boolean;
  }>(),
  customerAccount: text("customer_account"),
  defaultPaymentMethodId: text("default_payment_method_id"),
  discounts: text("discounts").array(),
  daysUntilDue: integer("days_until_due"),
  cancellationDetails: jsonb("cancellation_details").$type<{
    comment?: string;
    feedback?: string;
    reason?: string;
  }>(),
  // Connect Platform fields
  application: text("application"),
  applicationFeePercent: text("application_fee_percent"),
  onBehalfOf: text("on_behalf_of"),
  transferData: jsonb("transfer_data").$type<{
    amountPercent?: number;
    destination?: string;
  }>(),
  // Additional fields
  billingCycleAnchorConfig: jsonb("billing_cycle_anchor_config").$type<{
    dayOfMonth?: number;
    hour?: number;
    minute?: number;
    month?: number;
    second?: number;
  }>(),
  billingThresholds: jsonb("billing_thresholds").$type<{
    amountGte?: number;
    resetBillingCycleAnchor?: boolean;
  }>(),
  defaultSource: text("default_source"),
  defaultTaxRates: text("default_tax_rates").array(),
  invoiceSettings: jsonb("invoice_settings").$type<{
    accountTaxIds?: string[];
    issuer?: {
      account?: string;
      type?: string;
    };
  }>(),
  nextPendingInvoiceItemInvoice: timestamp("next_pending_invoice_item_invoice"),
  pauseCollection: jsonb("pause_collection").$type<{
    behavior?: string;
    resumesAt?: number;
  }>(),
  paymentSettings: jsonb("payment_settings").$type<{
    paymentMethodOptions?: Record<string, unknown>;
    paymentMethodTypes?: string[];
    saveDefaultPaymentMethod?: string;
  }>(),
  pendingInvoiceItemInterval: jsonb("pending_invoice_item_interval").$type<{
    interval?: string;
    intervalCount?: number;
  }>(),
  presentmentDetails: jsonb("presentment_details").$type<Record<string, unknown>>(),
  schedule: text("schedule"),
  startDate: timestamp("start_date").notNull(),
  testClock: text("test_clock"),
  trialSettings: jsonb("trial_settings").$type<{
    endBehavior?: {
      missingPaymentMethod?: string;
    };
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
