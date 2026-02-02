import { products } from "../tables/products";

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
