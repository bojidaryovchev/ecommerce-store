import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { customerTaxExemptEnum } from "../enums";

export const customers = pgTable("customer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeCustomerId: text("stripe_customer_id").unique(),
  object: text("object").default("customer"),
  email: text("email"),
  name: text("name"),
  phone: text("phone"),
  description: text("description"),
  address: jsonb("address").$type<{
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>(),
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
  }>(),
  tax: jsonb("tax").$type<{
    automaticTax?: string;
    ipAddress?: string;
    location?: {
      country?: string;
      state?: string;
      source?: string;
    };
  }>(),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  balance: integer("balance").default(0),
  currency: text("currency"),
  defaultSourceId: text("default_source_id"),
  delinquent: boolean("delinquent").default(false),
  invoiceSettings: jsonb("invoice_settings").$type<{
    customFields?: Array<{ name: string; value: string }>;
    defaultPaymentMethod?: string;
    footer?: string;
    renderingOptions?: {
      amountTaxDisplay?: string;
    };
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  customerAccount: text("customer_account"),
  businessName: text("business_name"),
  cashBalance: jsonb("cash_balance").$type<{
    available?: Record<string, number>;
    customer?: string;
    livemode?: boolean;
    settings?: {
      reconciliationMode?: string;
    };
  }>(),
  discount: jsonb("discount").$type<{
    id?: string;
    coupon?: string;
    customer?: string;
    end?: number;
    promotionCode?: string;
    start?: number;
    subscription?: string;
  }>(),
  individualName: text("individual_name"),
  invoiceCreditBalance: jsonb("invoice_credit_balance").$type<Record<string, number>>(),
  invoicePrefix: text("invoice_prefix"),
  nextInvoiceSequence: integer("next_invoice_sequence"),
  preferredLocales: text("preferred_locales").array(),
  sources: jsonb("sources").$type<{
    data?: Array<{ id?: string; object?: string; type?: string }>;
  }>(),
  subscriptions: jsonb("subscriptions").$type<{
    data?: Array<{ id?: string; status?: string }>;
  }>(),
  taxExempt: customerTaxExemptEnum("tax_exempt").default("none"),
  testClockId: text("test_clock_id"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
