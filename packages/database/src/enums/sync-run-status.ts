import { pgEnum } from "drizzle-orm/pg-core";

export const syncRunStatusEnum = pgEnum("sync_run_status", ["running", "succeeded", "failed", "skipped"]);
