import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * A product characteristic shown in specs and filters (power, colour, area covered…).
 */
export const attributes = pgTable("attribute", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit"),
  filterable: boolean("filterable").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
