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
    liabilty?: {
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
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
