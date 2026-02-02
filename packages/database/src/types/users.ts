import { users } from "../tables/users";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
