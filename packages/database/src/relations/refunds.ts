import { relations } from "drizzle-orm";
import { charges } from "../tables/charges";
import { orders } from "../tables/orders";
import { paymentIntents } from "../tables/payment-intents";
import { refunds } from "../tables/refunds";

export const refundsRelations = relations(refunds, ({ one }) => ({
  charge: one(charges, {
    fields: [refunds.chargeId],
    references: [charges.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [refunds.paymentIntentId],
    references: [paymentIntents.id],
  }),
  order: one(orders, {
    fields: [refunds.orderId],
    references: [orders.id],
  }),
}));
