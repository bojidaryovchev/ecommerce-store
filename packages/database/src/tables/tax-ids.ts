import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { taxIdTypeEnum } from "../enums";
import { customers } from "./customers";

export const taxIds = pgTable("tax_id", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  stripeTaxIdId: text("stripe_tax_id_id").unique(),
  object: text("object").default("tax_id"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  type: taxIdTypeEnum("type").notNull(),
  value: text("value").notNull(),
  country: text("country"),
  description: text("description"),
  owner: jsonb("owner").$type<{
    type?: string;
    customer?: string;
    account?: string;
  }>(),
  verification: jsonb("verification").$type<{
    status?: "pending" | "verified" | "unverified" | "unavailable";
    verifiedAddress?: string;
    verifiedName?: string;
  }>(),
  livemode: boolean("livemode").default(false).notNull(),
  created: timestamp("created", { mode: "date" }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
