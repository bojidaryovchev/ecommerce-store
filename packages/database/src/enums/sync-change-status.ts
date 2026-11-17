import { pgEnum } from "drizzle-orm/pg-core";

export const syncChangeStatusEnum = pgEnum("sync_change_status", ["pending", "applied", "dismissed"]);
