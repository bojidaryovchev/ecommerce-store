import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orderStatusEnum } from "../enums";
import { orders } from "./orders";
import { users } from "./users";

export const orderStatusHistory = pgTable("order_status_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  fromStatus: orderStatusEnum("from_status"),
  toStatus: orderStatusEnum("to_status").notNull(),
  changedBy: text("changed_by").references(() => users.id, { onDelete: "set null" }),
  actor: text("actor").notNull().default("system"),
  note: text("note"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
