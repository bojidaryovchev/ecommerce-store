import { syncRuns } from "../tables/sync-runs";

export type SyncRun = typeof syncRuns.$inferSelect;
export type NewSyncRun = typeof syncRuns.$inferInsert;
export type { SyncRunError, SyncRunStats } from "../tables/sync-runs";
