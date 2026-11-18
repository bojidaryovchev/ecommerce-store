import { pgEnum } from "drizzle-orm/pg-core";

/** supplier: replaced by every sync. enrichment: published from the enrichment pipeline. manual: typed by an admin. */
export const attributeValueSourceEnum = pgEnum("attribute_value_source", ["supplier", "enrichment", "manual"]);
