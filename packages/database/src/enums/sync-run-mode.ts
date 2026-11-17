import { pgEnum } from "drizzle-orm/pg-core";

export const syncRunModeEnum = pgEnum("sync_run_mode", ["incremental", "full"]);
