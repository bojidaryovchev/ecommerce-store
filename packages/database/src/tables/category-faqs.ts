import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { categories } from "./categories";

export type CategoryFaqItem = { question: string; answer: string };

/**
 * Where a category's questions stand: `published` (the page shows `items`), `revise` (the second reader sent the
 * draft back; the next run rewrites it from the notes), `held` (the reader would not pass it as it is: the notes
 * say what is missing) and `failed` (out of attempts). Held and failed drafts wait for the admin.
 */
export const CATEGORY_FAQ_STATUSES = ["published", "revise", "held", "failed"] as const;
export type CategoryFaqStatus = (typeof CATEGORY_FAQ_STATUSES)[number];

/**
 * A category page's questions and answers (packages/supplier-sync/src/enrich/faq.ts), in Bulgarian.
 *
 * `items` is what the page shows. The pipeline writes a draft and a second reader checks it; only a draft it
 * passes becomes `items`, a draft it holds waits in `draft` with its `notes`. Once the admin edits the questions
 * (`source` "admin") the pipeline leaves them alone.
 */
export const categoryFaqs = pgTable("category_faq", {
  categoryId: text("category_id")
    .primaryKey()
    .references(() => categories.id, { onDelete: "cascade" }),
  items: jsonb("items").$type<CategoryFaqItem[]>().notNull().default([]),
  draft: jsonb("draft").$type<CategoryFaqItem[] | null>(),
  status: text("status").$type<CategoryFaqStatus>().notNull(),
  /** The second reader's notes on the last draft. */
  notes: text("notes"),
  /** Drafts written since the last one passed; at three the questions wait for the admin. */
  attempts: integer("attempts").default(0).notNull(),
  source: text("source").$type<"generated" | "admin">().notNull().default("generated"),
  model: text("model"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
