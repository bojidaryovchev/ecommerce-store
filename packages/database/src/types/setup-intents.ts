import type { setupIntents } from "../tables/setup-intents";

export type SetupIntent = typeof setupIntents.$inferSelect;
export type InsertSetupIntent = typeof setupIntents.$inferInsert;
