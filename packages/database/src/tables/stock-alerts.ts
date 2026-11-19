import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { products } from "./products";

/**
 * A visitor's request to be emailed once when an out-of-stock product is back (apps/web/src/lib/stock-alerts.ts).
 *
 * Given with consent, and kept no longer than needed: the row is deleted when the email is sent, when the visitor
 * withdraws it, or after six months. Nothing else is sent to the address.
 */
export const stockAlerts = pgTable(
  "stock_alert",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Lower-case. */
    email: text("email").notNull(),
    /** The language of the page it was asked on, for the email. */
    locale: text("locale").$type<"bg" | "en">().notNull().default("bg"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("stock_alert_product_email_idx").on(table.productId, table.email),
    index("stock_alert_email_idx").on(table.email),
  ],
);
