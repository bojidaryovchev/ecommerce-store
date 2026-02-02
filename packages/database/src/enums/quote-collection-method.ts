import { pgEnum } from "drizzle-orm/pg-core";

export const quoteCollectionMethodEnum = pgEnum("quote_collection_method", ["charge_automatically", "send_invoice"]);
