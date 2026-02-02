import { categories } from "../tables/categories";

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
