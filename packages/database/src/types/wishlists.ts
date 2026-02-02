import { wishlists } from "../tables/wishlists";

export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert;
