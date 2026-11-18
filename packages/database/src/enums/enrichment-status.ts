import { pgEnum } from "drizzle-orm/pg-core";

/**
 * succeeded — the stage's output is usable
 * flagged   — it ran, but found problems a person must look at (the review queue lists them)
 * failed    — it did not finish (the model failed, or its answer was unusable); retried on the next run
 * pending   — publish only: waiting for an admin's approval
 * approved  — publish only: published, with the approved fields locked
 * rejected  — publish only: turned down; asked again only when the product's inputs change
 */
export const enrichmentStatusEnum = pgEnum("enrichment_status", [
  "succeeded",
  "flagged",
  "failed",
  "pending",
  "approved",
  "rejected",
]);
