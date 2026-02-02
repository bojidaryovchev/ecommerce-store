import { sessions } from "../tables/sessions";

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
