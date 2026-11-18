import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { imageKindEnum } from "../enums";

/**
 * What one image URL shows, shared by every product that uses it (the supplier reuses the same feature
 * icons across a whole range). Galleries show photos only; icons and badges become labelled chips.
 */
export const imageAssets = pgTable("image_asset", {
  url: text("url").primaryKey(),
  kind: imageKindEnum("kind").notNull(),
  /** A short caption in Bulgarian for icons and badges ("Wi-Fi", "A+++", "R32"). */
  label: text("label"),
  width: integer("width"),
  height: integer("height"),
  /** heuristic | model | manual. A manual decision is never overwritten. */
  source: text("source").notNull(),
  model: text("model"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
