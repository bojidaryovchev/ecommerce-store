import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  checkoutSessionModeEnum,
  checkoutSessionPaymentStatusEnum,
  checkoutSessionStatusEnum,
  checkoutSessionUiModeEnum,
} from "../enums";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { paymentIntents } from "./payment-intents";
import { subscriptions } from "./subscriptions";

export const checkoutSessions = pgTable("checkout_session", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeCheckoutSessionId: text("stripe_checkout_session_id").unique().notNull(),
  object: text("object").default("checkout.session"),
  clientReferenceId: text("client_reference_id"),
  currency: text("currency"),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  customerEmail: text("customer_email"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  mode: checkoutSessionModeEnum("mode").notNull(),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  paymentStatus: checkoutSessionPaymentStatusEnum("payment_status").notNull(),
  status: checkoutSessionStatusEnum("status").notNull(),
  successUrl: text("success_url"),
  cancelUrl: text("cancel_url"),
  returnUrl: text("return_url"),
  uiMode: checkoutSessionUiModeEnum("ui_mode").default("hosted"),
  url: text("url"),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  setupIntentId: text("setup_intent_id"),
  paymentLinkId: text("payment_link_id"),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  automaticTax: jsonb("automatic_tax").$type<{
    enabled?: boolean;
    liability?: {
      type?: string;
      account?: string;
    };
    status?: string;
  }>(),
  lineItems: jsonb("line_items").$type<
    Array<{
      priceId?: string;
      quantity?: number;
      description?: string;
      amount?: number;
    }>
  >(),
  clientSecret: text("client_secret"),
  customerAccount: text("customer_account"),
  livemode: boolean("livemode").default(false).notNull(),
  paymentMethodTypes: text("payment_method_types").array(),
  shippingOptions: jsonb("shipping_options").$type<
    Array<{
      shippingRateId?: string;
      shippingAmount?: number;
    }>
  >(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
