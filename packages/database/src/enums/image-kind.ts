import { pgEnum } from "drizzle-orm/pg-core";

/**
 * What a supplier image shows. Only photos belong in a product gallery; icons and badges become small
 * labelled chips, and spec tables are read for their figures.
 */
export const imageKindEnum = pgEnum("image_kind", [
  "photo",
  "icon",
  "badge",
  "energy_label",
  "spec_table",
  "diagram",
  "logo",
  "other",
]);
