import { relations } from "drizzle-orm";
import { customers, setupIntents } from "../tables";

export const setupIntentsRelations = relations(setupIntents, ({ one }) => ({
  customer: one(customers, {
    fields: [setupIntents.customerId],
    references: [customers.id],
  }),
}));
