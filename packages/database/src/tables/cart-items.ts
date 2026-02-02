import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { carts } from "./carts";
import { prices } from "./prices";
import { products } from "./products";

export const cartItems = pgTable("cart_item", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  cartId: text("cart_id")
    .notNull()
    .references(() => carts.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  priceId: text("price_id")
    .notNull()
    .references(() => prices.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
