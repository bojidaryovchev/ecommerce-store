import { pgEnum } from "drizzle-orm/pg-core";

export const checkoutSessionUiModeEnum = pgEnum("checkout_session_ui_mode", ["hosted", "embedded", "custom"]);
