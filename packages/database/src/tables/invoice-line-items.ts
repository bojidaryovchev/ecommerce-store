import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { subscriptions } from "./subscriptions";

export const invoiceLineItems = pgTable("invoice_line_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeInvoiceLineItemId: text("stripe_invoice_line_item_id").unique().notNull(),
  object: text("object").default("line_item"),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscriptions.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  period: jsonb("period").$type<{
    start?: number;
    end?: number;
  }>(),
  pricing: jsonb("pricing").$type<{
    price?: {
      id?: string;
      product?: string;
      currency?: string;
      unitAmount?: number;
      recurring?: {
        interval?: string;
        intervalCount?: number;
      };
    };
  }>(),
  quantity: integer("quantity"),
  discountable: boolean("discountable").default(true),
  discounts: text("discounts").array(),
  // Missing fields
  discountAmounts: jsonb("discount_amounts").$type<
    Array<{
      amount?: number;
      discount?: string;
    }>
  >(),
  livemode: boolean("livemode").default(false).notNull(),
  parent: jsonb("parent").$type<{
    id?: string;
    object?: string;
  }>(),
  pretaxCreditAmounts: jsonb("pretax_credit_amounts").$type<
    Array<{
      amount?: number;
      creditNote?: string;
    }>
  >(),
  subtotal: integer("subtotal").default(0).notNull(),
  taxes: jsonb("taxes").$type<
    Array<{
      amount?: number;
      rate?: string;
      taxabilityReason?: string;
    }>
  >(),
  quantityDecimal: text("quantity_decimal"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
