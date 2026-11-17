import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { syncRunModeEnum, syncRunStatusEnum, syncRunTriggerEnum } from "../enums";
import { suppliers } from "./suppliers";

export type SyncRunStats = {
  /** Products listed by the supplier in this run. */
  seen: number;
  /** Products whose full data was downloaded. */
  fetched: number;
  created: number;
  updated: number;
  unchanged: number;
  removed: number;
  restored: number;
  failed: number;
  /** Review-queue entries this run added or refreshed. */
  pendingReview: number;
};

export type SyncRunError = { externalId?: number; message: string };

/** One execution of the supplier sync, for the admin log and alerting. */
export const syncRuns = pgTable(
  "sync_run",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    supplierId: text("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
    mode: syncRunModeEnum("mode").notNull(),
    trigger: syncRunTriggerEnum("trigger").notNull(),
    status: syncRunStatusEnum("status").default("running").notNull(),
    startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { mode: "date" }),
    stats: jsonb("stats").$type<SyncRunStats>().notNull().default({
      seen: 0,
      fetched: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      removed: 0,
      restored: 0,
      failed: 0,
      pendingReview: 0,
    }),
    /** Per-product failures; the run itself still succeeds. */
    errors: jsonb("errors").$type<SyncRunError[]>().notNull().default([]),
    /** Set when the whole run failed. */
    error: text("error"),
  },
  (table) => [index("sync_run_supplier_started_idx").on(table.supplierId, table.startedAt)],
);
