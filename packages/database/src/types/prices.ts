import { prices } from "../tables/prices";

export type Price = typeof prices.$inferSelect;
export type NewPrice = typeof prices.$inferInsert;
