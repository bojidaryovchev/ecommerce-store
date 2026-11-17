import { pgEnum } from "drizzle-orm/pg-core";

export const syncRunTriggerEnum = pgEnum("sync_run_trigger", ["schedule", "manual", "cli"]);
