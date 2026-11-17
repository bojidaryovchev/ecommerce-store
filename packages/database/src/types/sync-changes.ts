import { syncChanges } from "../tables/sync-changes";

export type SyncChange = typeof syncChanges.$inferSelect;
export type NewSyncChange = typeof syncChanges.$inferInsert;
