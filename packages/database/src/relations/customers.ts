import { relations } from "drizzle-orm";
import { charges } from "../tables/charges";
import { checkoutSessions } from "../tables/checkout-sessions";
import { creditNotes } from "../tables/credit-notes";
import { customers } from "../tables/customers";
import { discounts } from "../tables/discounts";
import { invoiceItems } from "../tables/invoice-items";
import { invoices } from "../tables/invoices";
import { paymentIntents } from "../tables/payment-intents";
import { paymentMethods } from "../tables/payment-methods";
import { quotes } from "../tables/quotes";
import { setupIntents } from "../tables/setup-intents";
import { subscriptions } from "../tables/subscriptions";
import { taxIds } from "../tables/tax-ids";

export const customersRelations = relations(customers, ({ many }) => ({
  paymentIntents: many(paymentIntents),
  paymentMethods: many(paymentMethods),
  subscriptions: many(subscriptions),
  taxIds: many(taxIds),
  discounts: many(discounts),
  charges: many(charges),
  invoices: many(invoices),
  checkoutSessions: many(checkoutSessions),
  invoiceItems: many(invoiceItems),
  creditNotes: many(creditNotes),
  setupIntents: many(setupIntents),
  quotes: many(quotes),
}));
