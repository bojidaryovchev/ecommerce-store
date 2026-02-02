import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  image: text("image"),
  parentId: text("parent_id"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
