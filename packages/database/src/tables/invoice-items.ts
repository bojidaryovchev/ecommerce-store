import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { prices } from "./prices";

export const invoiceItems = pgTable("invoice_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeInvoiceItemId: text("stripe_invoice_item_id").unique().notNull(),
  object: text("object").default("invoiceitem"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  invoiceId: text("invoice_id").references(() => invoices.id, { onDelete: "set null" }),
  priceId: text("price_id").references(() => prices.id, { onDelete: "set null" }),
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
  quantity: integer("quantity").default(1),
  proration: boolean("proration").default(false),
  date: timestamp("date", { mode: "date" }),
  customerAccount: text("customer_account"),
  discountable: boolean("discountable").default(true),
  discounts: text("discounts").array(),
  livemode: boolean("livemode").default(false).notNull(),
  taxRates: text("tax_rates").array(),
  // Missing fields
  netAmount: integer("net_amount"),
  parent: jsonb("parent").$type<{
    id?: string;
    object?: string;
  }>(),
  prorationDetails: jsonb("proration_details").$type<{
    creditedItems?: {
      invoice?: string;
      invoiceLineItems?: string[];
    };
  }>(),
  testClock: text("test_clock"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
