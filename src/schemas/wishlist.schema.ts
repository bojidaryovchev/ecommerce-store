import { z } from "zod";

/**
 * Schema for adding a product to wishlist
 */
export const addToWishlistSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
});

/**
 * Schema for removing a product from wishlist
 */
export const removeFromWishlistSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
});

/**
 * Type inference
 */
export type AddToWishlistData = z.infer<typeof addToWishlistSchema>;
export type RemoveFromWishlistData = z.infer<typeof removeFromWishlistSchema>;
