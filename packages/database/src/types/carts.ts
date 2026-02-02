import { carts } from "../tables/carts";

export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;
