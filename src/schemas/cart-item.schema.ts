import { z } from "zod";

/**
 * Cart item creation/update schema
 * Validates cart item data including quantity limits
 */
export const cartItemSchema = z.object({
  cartId: z.cuid("Invalid cart ID"),

  productId: z.cuid("Invalid product ID"),

  variantId: z.cuid("Invalid variant ID").optional().nullable(),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999")
    .default(1),
});

/**
 * Cart item update schema - typically only quantity is updated
 */
export const cartItemUpdateSchema = z.object({
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999"),
});

/**
 * Add to cart schema - used when adding items from product page
 */
export const addToCartSchema = z.object({
  productId: z.cuid("Invalid product ID"),

  variantId: z.cuid("Invalid variant ID").optional().nullable(),

  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity cannot exceed 999")
    .default(1),
});

/**
 * Type inference for cart item form data
 */
export type CartItemFormData = z.infer<typeof cartItemSchema>;
export type CartItemUpdateFormData = z.infer<typeof cartItemUpdateSchema>;
export type AddToCartFormData = z.infer<typeof addToCartSchema>;
