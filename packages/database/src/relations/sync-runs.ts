import { relations } from "drizzle-orm";
import { suppliers } from "../tables/suppliers";
import { syncChanges } from "../tables/sync-changes";
import { syncRuns } from "../tables/sync-runs";

export const syncRunsRelations = relations(syncRuns, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [syncRuns.supplierId],
    references: [suppliers.id],
  }),
  changes: many(syncChanges),
}));
