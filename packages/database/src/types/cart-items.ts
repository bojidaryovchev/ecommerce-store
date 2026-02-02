import { cartItems } from "../tables/cart-items";

export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
