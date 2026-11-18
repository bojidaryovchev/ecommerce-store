import { pgEnum } from "drizzle-orm/pg-core";

/**
 * The gates a supplier product passes on its way to our own data and copy (packages/supplier-sync/src/enrich):
 *
 * extract  — specifications read from the supplier's text, attributes and images, and researched on the web
 * validate — consistency checks on what was extracted (name against specs, ranges, required fields)
 * classify — the category, where the product has none, and what each image is (photo, icon, badge…)
 * rewrite  — the shop's own name, description and meta description
 * review   — a second reader's check of the copy against the facts, the search phrases and the shop's rules
 * publish  — an admin's approval; approved fields are locked against the sync
 */
export const enrichmentStageEnum = pgEnum("enrichment_stage", [
  "extract",
  "validate",
  "classify",
  "rewrite",
  "review",
  "publish",
]);
