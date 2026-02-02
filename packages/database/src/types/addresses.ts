import { addresses } from "../tables/addresses";

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
