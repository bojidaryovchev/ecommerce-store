import { pgEnum } from "drizzle-orm/pg-core";

export const setupIntentUsageEnum = pgEnum("setup_intent_usage", ["off_session", "on_session"]);
