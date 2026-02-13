import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import {
  paymentIntentCaptureMethodEnum,
  paymentIntentConfirmationMethodEnum,
  paymentIntentSetupFutureUsageEnum,
  paymentIntentStatusEnum,
} from "../enums";
import { customers } from "./customers";

export const paymentIntents = pgTable("payment_intent", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePaymentIntentId: text("stripe_payment_intent_id").unique().notNull(),
  object: text("object").default("payment_intent"),
  amount: integer("amount").notNull(),
  amountCapturable: integer("amount_capturable").default(0).notNull(),
  amountReceived: integer("amount_received").default(0).notNull(),
  automaticPaymentMethods: jsonb("automatic_payment_methods").$type<{
    allowRedirects?: string;
    enabled?: boolean;
  }>(),
  currency: text("currency").notNull(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  description: text("description"),
  latestChargeId: text("latest_charge_id"),
  metadata: jsonb("metadata").$type<Record<string, string>>().notNull().default({}),
  paymentMethodId: text("payment_method_id"),
  receiptEmail: text("receipt_email"),
  shipping: jsonb("shipping").$type<{
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
    carrier?: string;
    trackingNumber?: string;
  }>(),
  status: paymentIntentStatusEnum("status").notNull(),
  setupFutureUsage: paymentIntentSetupFutureUsageEnum("setup_future_usage"),
  captureMethod: paymentIntentCaptureMethodEnum("capture_method").default("automatic"),
  confirmationMethod: paymentIntentConfirmationMethodEnum("confirmation_method").default("automatic"),
  clientSecret: text("client_secret"),
  customerAccount: text("customer_account"),
  lastPaymentError: jsonb("last_payment_error").$type<{
    charge?: string;
    code?: string;
    declineCode?: string;
    docUrl?: string;
    message?: string;
    param?: string;
    paymentMethod?: {
      id?: string;
      type?: string;
    };
    type?: string;
  }>(),
  nextAction: jsonb("next_action").$type<{
    type?: string;
    redirectToUrl?: {
      returnUrl?: string;
      url?: string;
    };
    useStripeSdk?: Record<string, unknown>;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  statementDescriptor: text("statement_descriptor"),
  statementDescriptorSuffix: text("statement_descriptor_suffix"),
  invoiceId: text("invoice_id"),
  canceledAt: timestamp("canceled_at", { mode: "date" }),
  cancellationReason: text("cancellation_reason"),
  amountDetails: jsonb("amount_details").$type<{
    tip?: { amount?: number };
  }>(),
  paymentMethodTypes: text("payment_method_types").array(),
  paymentMethodOptions: jsonb("payment_method_options").$type<Record<string, unknown>>(),
  processing: jsonb("processing").$type<Record<string, unknown>>(),
  // Connect Platform fields
  application: text("application"),
  applicationFeeAmount: integer("application_fee_amount"),
  onBehalfOf: text("on_behalf_of"),
  transferData: jsonb("transfer_data").$type<{
    amount?: number;
    destination?: string;
  }>(),
  transferGroup: text("transfer_group"),
  // Additional fields
  review: text("review"),
  excludedPaymentMethodTypes: text("excluded_payment_method_types").array(),
  hooks: jsonb("hooks").$type<Record<string, unknown>>(),
  paymentDetails: jsonb("payment_details").$type<Record<string, unknown>>(),
  paymentMethodConfigurationDetails: jsonb("payment_method_configuration_details").$type<{
    id?: string;
    parent?: string;
  }>(),
  presentmentDetails: jsonb("presentment_details").$type<Record<string, unknown>>(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
