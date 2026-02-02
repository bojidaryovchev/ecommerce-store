import { pgEnum } from "drizzle-orm/pg-core";

export const priceTypeEnum = pgEnum("price_type", ["one_time", "recurring"]);
