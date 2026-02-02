import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { quoteCollectionMethodEnum, quoteStatusEnum } from "../enums";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { subscriptions } from "./subscriptions";

export const quotes = pgTable("quote", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeQuoteId: text("stripe_quote_id").unique().notNull(),
  object: text("object").default("quote"),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  status: quoteStatusEnum("status").notNull(),
  amountSubtotal: integer("amount_subtotal"),
  amountTotal: integer("amount_total"),
  application: text("application"),
  applicationFeeAmount: integer("application_fee_amount"),
  applicationFeePercent: text("application_fee_percent"),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
    status?: string;
  }>(),
  collectionMethod: quoteCollectionMethodEnum("collection_method").default("charge_automatically"),
  computedUpfrontTotal: jsonb("computed_upfront_total").$type<{
    amountSubtotal?: number;
    amountTotal?: number;
    totalDetails?: {
      amountDiscount?: number;
      amountShipping?: number;
      amountTax?: number;
    };
  }>(),
  computedRecurringTotal: jsonb("computed_recurring_total").$type<{
    amountSubtotal?: number;
    amountTotal?: number;
    interval?: "day" | "week" | "month" | "year";
    intervalCount?: number;
    totalDetails?: {
      amountDiscount?: number;
      amountShipping?: number;
      amountTax?: number;
    };
  }>(),
  currency: text("currency"),
  defaultTaxRates: text("default_tax_rates").array(),
  description: text("description"),
  discounts: text("discounts").array(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  footer: text("footer"),
  fromQuoteId: text("from_quote_id"),
  header: text("header"),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  invoiceSettings: jsonb("invoice_settings").$type<{
    daysUntilDue?: number;
    issuer?: {
      account?: string;
      type?: "account" | "self";
    };
  }>(),
  lineItems: jsonb("line_items").$type<{
    data?: Array<{
      id?: string;
      amount?: number;
      description?: string;
      price?: {
        id?: string;
        product?: string;
      };
      quantity?: number;
      taxes?: Array<{
        amount?: number;
        rate?: {
          id?: string;
          percentage?: number;
        };
      }>;
    }>;
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  number: text("number"),
  onBehalfOf: text("on_behalf_of"),
  statusTransitions: jsonb("status_transitions").$type<{
    acceptedAt?: number;
    canceledAt?: number;
    finalizedAt?: number;
  }>(),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  subscriptionData: jsonb("subscription_data").$type<{
    description?: string;
    effectiveDate?: number | "current_period_end";
    metadata?: Record<string, string>;
    trialPeriodDays?: number;
  }>(),
  subscriptionScheduleId: text("subscription_schedule_id"),
  testClock: text("test_clock"),
  totalDetails: jsonb("total_details").$type<{
    amountDiscount?: number;
    amountShipping?: number;
    amountTax?: number;
    breakdown?: {
      discounts?: Array<{
        amount?: number;
        discount?: {
          id?: string;
          coupon?: string;
        };
      }>;
      taxes?: Array<{
        amount?: number;
        rate?: {
          id?: string;
          percentage?: number;
        };
      }>;
    };
  }>(),
  transferData: jsonb("transfer_data").$type<{
    amount?: number;
    amountPercent?: number;
    destination?: string;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
