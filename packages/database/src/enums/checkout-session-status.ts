import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutSessionStatusEnum = pgEnum("checkout_session_status", ["open", "complete", "expired"]);
