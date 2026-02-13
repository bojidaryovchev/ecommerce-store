import { boolean, integer, jsonb, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { balanceTransactionTypeEnum } from "../enums";

export const balanceTransactions = pgTable("balance_transaction", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeBalanceTransactionId: text("stripe_balance_transaction_id").unique().notNull(),
  object: text("object").default("balance_transaction"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  description: text("description"),
  fee: integer("fee").default(0).notNull(),
  feeDetails: jsonb("fee_details").$type<
    Array<{
      amount?: number;
      application?: string;
      currency?: string;
      description?: string;
      type?: string;
    }>
  >(),
  net: integer("net").notNull(),
  sourceId: text("source_id"),
  status: text("status"),
  type: balanceTransactionTypeEnum("type").notNull(),
  availableOn: timestamp("available_on", { mode: "date" }),
  balanceType: text("balance_type"),
  exchangeRate: numeric("exchange_rate", { precision: 20, scale: 10 }),
  livemode: boolean("livemode").default(false).notNull(),
  reportingCategory: text("reporting_category"),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
