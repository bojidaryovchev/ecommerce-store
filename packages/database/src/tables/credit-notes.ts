import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { creditNoteReasonEnum, creditNoteStatusEnum, creditNoteTypeEnum } from "../enums";
import { customers } from "./customers";
import { invoices } from "./invoices";
import { refunds } from "./refunds";

export const creditNotes = pgTable("credit_note", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeCreditNoteId: text("stripe_credit_note_id").unique().notNull(),
  object: text("object").default("credit_note"),
  customerId: text("customer_id").references(() => customers.id, { onDelete: "set null" }),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  refundId: text("refund_id").references(() => refunds.id, { onDelete: "set null" }),
  amount: integer("amount").notNull(),
  amountShipping: integer("amount_shipping").default(0),
  currency: text("currency").notNull(),
  customerBalanceTransaction: text("customer_balance_transaction"),
  discountAmount: integer("discount_amount").default(0),
  discountAmounts: jsonb("discount_amounts").$type<
    Array<{
      amount?: number;
      discount?: string;
    }>
  >(),
  effectiveAt: timestamp("effective_at", { mode: "date" }),
  lines: jsonb("lines").$type<{
    data?: Array<{
      id?: string;
      amount?: number;
      amountExcludingTax?: number;
      description?: string;
      discountAmount?: number;
      discountAmounts?: Array<{
        amount?: number;
        discount?: string;
      }>;
      invoiceLineItem?: string;
      quantity?: number;
      taxAmounts?: Array<{
        amount?: number;
        inclusive?: boolean;
        taxRate?: string;
        taxabilityReason?: string;
      }>;
      taxRates?: Array<{
        id?: string;
        percentage?: number;
      }>;
      type?: "custom_line_item" | "invoice_line_item";
      unitAmount?: number;
      unitAmountDecimal?: string;
      unitAmountExcludingTax?: number;
    }>;
  }>(),
  memo: text("memo"),
  metadata: jsonb("metadata").$type<Record<string, string>>(),
  number: text("number"),
  outOfBandAmount: integer("out_of_band_amount"),
  pdf: text("pdf"),
  reason: creditNoteReasonEnum("reason"),
  shippingCost: jsonb("shipping_cost").$type<{
    amountSubtotal?: number;
    amountTax?: number;
    amountTotal?: number;
    shippingRate?: string;
    taxes?: Array<{
      amount?: number;
      rate?: {
        id?: string;
        percentage?: number;
      };
      taxabilityReason?: string;
    }>;
  }>(),
  status: creditNoteStatusEnum("status").notNull(),
  subtotal: integer("subtotal").notNull(),
  subtotalExcludingTax: integer("subtotal_excluding_tax"),
  taxAmounts: jsonb("tax_amounts").$type<
    Array<{
      amount?: number;
      inclusive?: boolean;
      taxRate?: string;
      taxabilityReason?: string;
    }>
  >(),
  total: integer("total").notNull(),
  totalExcludingTax: integer("total_excluding_tax"),
  type: creditNoteTypeEnum("type").notNull(),
  voidedAt: timestamp("voided_at", { mode: "date" }),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
