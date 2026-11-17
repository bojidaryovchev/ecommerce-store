import { pgEnum } from "drizzle-orm/pg-core";

export const attributeValueSourceEnum = pgEnum("attribute_value_source", ["supplier", "manual"]);
