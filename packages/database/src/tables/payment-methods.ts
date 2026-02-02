import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { paymentMethodTypeEnum } from "../enums";
import { customers } from "./customers";

export const paymentMethods = pgTable("payment_method", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripePaymentMethodId: text("stripe_payment_method_id").unique().notNull(),
  object: text("object").default("payment_method"),
  type: paymentMethodTypeEnum("type").notNull(),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
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
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  // Card-specific fields
  card: jsonb("card").$type<{
    brand?: string;
    country?: string;
    expMonth?: number;
    expYear?: number;
    fingerprint?: string;
    funding?: string;
    last4?: string;
    networks?: {
      available?: string[];
      preferred?: string;
    };
    threeDSecureUsage?: {
      supported?: boolean;
    };
    wallet?: {
      type?: string;
      applePay?: Record<string, unknown>;
      googlePay?: Record<string, unknown>;
    };
  }>(),
  // Bank account fields
  usBankAccount: jsonb("us_bank_account").$type<{
    accountHolderType?: string;
    accountType?: string;
    bankName?: string;
    fingerprint?: string;
    last4?: string;
    networks?: {
      preferred?: string;
      supported?: string[];
    };
    routingNumber?: string;
  }>(),
  sepaDebit: jsonb("sepa_debit").$type<{
    bankCode?: string;
    branchCode?: string;
    country?: string;
    fingerprint?: string;
    last4?: string;
  }>(),
  // Additional payment method type data stored as generic JSON
  paymentMethodData: jsonb("payment_method_data").$type<Record<string, unknown>>(),
  allowRedisplay: text("allow_redisplay"),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
