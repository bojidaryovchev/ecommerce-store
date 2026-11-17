import { pgEnum } from "drizzle-orm/pg-core";

export const productTypeEnum = pgEnum("product_type", ["good", "service"]);
