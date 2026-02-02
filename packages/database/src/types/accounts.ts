import { accounts } from "../tables/accounts";

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
