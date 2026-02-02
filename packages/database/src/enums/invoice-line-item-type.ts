import { pgEnum } from "drizzle-orm/pg-core";

export const invoiceLineItemTypeEnum = pgEnum("invoice_line_item_type", ["invoiceitem", "subscription"]);
