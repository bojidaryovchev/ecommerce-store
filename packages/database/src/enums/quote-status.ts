import { pgEnum } from "drizzle-orm/pg-core";

export const quoteStatusEnum = pgEnum("quote_status", ["draft", "open", "accepted", "canceled"]);
