import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { orders } from "./orders";
import { prices } from "./prices";
import { products } from "./products";

export const orderItems = pgTable("order_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  priceId: text("price_id").references(() => prices.id, {
    onDelete: "set null",
  }),
  productSnapshot: jsonb("product_snapshot")
    .$type<{
      name: string;
      description?: string;
      images?: string[];
    }>()
    .notNull(),
  priceSnapshot: jsonb("price_snapshot")
    .$type<{
      unitAmount: number;
      currency: string;
    }>()
    .notNull(),
  quantity: integer("quantity").notNull(),
  totalAmount: integer("total_amount").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
