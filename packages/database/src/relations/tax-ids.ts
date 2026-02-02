import { relations } from "drizzle-orm";
import { customers } from "../tables/customers";
import { taxIds } from "../tables/tax-ids";

export const taxIdsRelations = relations(taxIds, ({ one }) => ({
  customer: one(customers, {
    fields: [taxIds.customerId],
    references: [customers.id],
  }),
}));
