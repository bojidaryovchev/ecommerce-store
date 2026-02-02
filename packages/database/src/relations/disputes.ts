import { relations } from "drizzle-orm";
import { charges } from "../tables/charges";
import { disputes } from "../tables/disputes";
import { paymentIntents } from "../tables/payment-intents";

export const disputesRelations = relations(disputes, ({ one }) => ({
  charge: one(charges, {
    fields: [disputes.chargeId],
    references: [charges.id],
  }),
  paymentIntent: one(paymentIntents, {
    fields: [disputes.paymentIntentId],
    references: [paymentIntents.id],
  }),
}));
