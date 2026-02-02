import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { products } from "./products";
import { users } from "./users";

export const reviews = pgTable("review", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  rating: integer("rating").notNull(),
  title: text("title"),
  content: text("content"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
