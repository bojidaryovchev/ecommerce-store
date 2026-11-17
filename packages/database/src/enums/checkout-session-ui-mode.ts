import { pgEnum } from "drizzle-orm/pg-core";

// Renamed in API 2026-03-25.dahlia: hosted -> hosted_page, embedded -> embedded_page, custom -> elements; form added.
export const checkoutSessionUiModeEnum = pgEnum("checkout_session_ui_mode", [
  "hosted_page",
  "embedded_page",
  "elements",
  "form",
]);
