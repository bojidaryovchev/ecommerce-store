import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { invoiceLineItemTypeEnum } from "../enums";
import { invoices } from "./invoices";
import { subscriptionItems } from "./subscription-items";

export const invoiceLineItems = pgTable("invoice_line_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeInvoiceLineItemId: text("stripe_invoice_line_item_id").unique().notNull(),
  object: text("object").default("line_item"),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  subscriptionItemId: text("subscription_item_id").references(() => subscriptionItems.id, { onDelete: "set null" }),
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
  proration: boolean("proration").default(false),
  discountable: boolean("discountable").default(true),
  discounts: text("discounts").array(),
  taxRates: text("tax_rates").array(),
  type: invoiceLineItemTypeEnum("type"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
