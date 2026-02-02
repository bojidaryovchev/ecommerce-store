import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { chargeStatusEnum } from "../enums";
import { customers } from "./customers";
import { paymentIntents } from "./payment-intents";

export const charges = pgTable("charge", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeChargeId: text("stripe_charge_id").unique().notNull(),
  object: text("object").default("charge"),
  amount: integer("amount").notNull(),
  amountCaptured: integer("amount_captured").default(0),
  amountRefunded: integer("amount_refunded").default(0),
  billingDetails: jsonb("billing_details").$type<{
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
    email?: string;
    name?: string;
    phone?: string;
  }>(),
  currency: text("currency").notNull(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  description: text("description"),
  disputed: boolean("disputed").default(false),
  paymentIntentId: text("payment_intent_id").references(() => paymentIntents.id, { onDelete: "set null" }),
  paymentMethodDetails: jsonb("payment_method_details").$type<{
    card?: {
      brand?: string;
      country?: string;
      expMonth?: number;
      expYear?: number;
      fingerprint?: string;
      funding?: string;
      last4?: string;
      network?: string;
      threeDSecure?: {
        authenticated?: boolean;
        succeeded?: boolean;
        version?: string;
      };
    };
    type?: string;
  }>(),
  receiptEmail: text("receipt_email"),
  refunded: boolean("refunded").default(false),
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
  statementDescriptor: text("statement_descriptor"),
  statementDescriptorSuffix: text("statement_descriptor_suffix"),
  status: chargeStatusEnum("status").notNull(),
  paid: boolean("paid").default(false),
  balanceTransactionId: text("balance_transaction_id"),
  captured: boolean("captured").default(false),
  failureCode: text("failure_code"),
  failureMessage: text("failure_message"),
  outcome: jsonb("outcome").$type<{
    networkStatus?: string;
    reason?: string;
    riskLevel?: string;
    riskScore?: number;
    sellerMessage?: string;
    type?: string;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  receiptUrl: text("receipt_url"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
