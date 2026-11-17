import { pgEnum } from "drizzle-orm/pg-core";

export const supplierPlatformEnum = pgEnum("supplier_platform", ["woocommerce"]);
