import { pgEnum } from "drizzle-orm/pg-core";

export const taxBehaviorEnum = pgEnum("tax_behavior", ["inclusive", "exclusive", "unspecified"]);
