import { orders } from "../tables/orders";

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
