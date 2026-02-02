import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutSessionModeEnum = pgEnum("checkout_session_mode", ["payment", "setup", "subscription"]);
