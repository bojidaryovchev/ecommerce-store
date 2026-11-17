import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { supplierPlatformEnum } from "../enums";

/**
 * A company whose catalog we resell. Products are imported from its shop API and
 * kept in sync (see @ecommerce/supplier-sync).
 */
export const suppliers = pgTable("supplier", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  baseUrl: text("base_url").notNull(),
  platform: supplierPlatformEnum("platform").default("woocommerce").notNull(),
  active: boolean("active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
  lastFullSyncAt: timestamp("last_full_sync_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
