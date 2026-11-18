import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { enrichmentStageEnum, enrichmentStatusEnum } from "../enums";
import { products } from "./products";
import { users } from "./users";

/**
 * One product's result at one stage of the enrichment pipeline (packages/supplier-sync/src/enrich).
 *
 * `inputsHash` is a hash of everything the stage read. A run skips a stage whose stored hash matches the
 * product's current inputs, so a backfill resumes where it stopped and the scheduled run only touches
 * products the supplier changed. `output` is the stage's result (its shape is the stage's contract in
 * enrich/contract.ts); `errors` say why a stage was flagged or failed.
 */
export const productEnrichments = pgTable(
  "product_enrichment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    stage: enrichmentStageEnum("stage").notNull(),
    status: enrichmentStatusEnum("status").notNull(),
    inputsHash: text("inputs_hash").notNull(),
    output: jsonb("output").$type<unknown>(),
    errors: jsonb("errors").$type<string[]>().notNull().default([]),
    /** Consecutive failed runs; a stage that keeps failing is left for a person. */
    attempts: integer("attempts").default(0).notNull(),
    /** The model that produced the output, for model stages. */
    model: text("model"),
    /** Publish only: who approved or rejected, and when. */
    reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
    startedAt: timestamp("started_at", { mode: "date" }),
    finishedAt: timestamp("finished_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("product_enrichment_product_stage_idx").on(table.productId, table.stage),
    index("product_enrichment_stage_status_idx").on(table.stage, table.status),
  ],
);
