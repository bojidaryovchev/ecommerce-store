import { pgEnum } from "drizzle-orm/pg-core";

/**
 * new_product          — the supplier added a product; ours starts as a draft until approved.
 * price_change         — the supplier's price moved; small moves apply automatically, large ones wait here.
 * removed              — the product disappeared from two consecutive syncs; ours was unpublished.
 * restored             — a removed product came back; ours stays unpublished until approved.
 * locked_field_changed — the supplier changed a field we override; ours was left alone.
 * enrichment_flagged   — the enrichment pipeline found a data problem (specs that contradict the name,
 *                        values out of range, missing fields); nothing of it is published until reviewed.
 */
export const syncChangeTypeEnum = pgEnum("sync_change_type", [
  "new_product",
  "price_change",
  "removed",
  "restored",
  "locked_field_changed",
  "enrichment_flagged",
]);
