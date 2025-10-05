import { z } from "zod";

/**
 * Add to Cart Schema
 * Used when adding a product (with optional variant) to the cart
 */
export const addToCartSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  variantId: z.string().cuid("Invalid variant ID").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(999, "Quantity cannot exceed 999").default(1),
});

/**
 * Update Cart Item Schema
 * Used when modifying the quantity of an existing cart item
 */
export const updateCartItemSchema = z.object({
  cartItemId: z.string().cuid("Invalid cart item ID"),
  quantity: z.number().int().min(0, "Quantity cannot be negative").max(999, "Quantity cannot exceed 999"),
});

/**
 * Remove from Cart Schema
 * Used when removing a specific item from the cart
 */
export const removeFromCartSchema = z.object({
  cartItemId: z.string().cuid("Invalid cart item ID"),
});

/**
 * Cart Item Validation Schema
 * For validating individual cart items with product details
 */
export const cartItemValidationSchema = z.object({
  id: z.string().cuid(),
  productId: z.string().cuid(),
  variantId: z.string().cuid().nullable(),
  quantity: z.number().int().min(1).max(999),
  product: z.object({
    id: z.string().cuid(),
    name: z.string(),
    slug: z.string(),
    price: z.number(),
    isActive: z.boolean(),
    trackInventory: z.boolean(),
    stockQuantity: z.number().int().min(0),
  }),
  variant: z
    .object({
      id: z.string().cuid(),
      name: z.string(),
      price: z.number().nullable(),
      isActive: z.boolean(),
      stockQuantity: z.number().int().min(0),
    })
    .nullable(),
});

/**
 * Cart Summary Schema
 * For cart totals and summary information
 */
export const cartSummarySchema = z.object({
  itemCount: z.number().int().min(0),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).default(0),
  shippingAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  total: z.number().min(0),
});

/**
 * Guest Session Schema
 * For validating guest cart session IDs
 */
export const guestSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});

/**
 * Type inference for cart operations
 */
export type AddToCartData = z.infer<typeof addToCartSchema>;
export type UpdateCartItemData = z.infer<typeof updateCartItemSchema>;
export type RemoveFromCartData = z.infer<typeof removeFromCartSchema>;
export type CartItemValidation = z.infer<typeof cartItemValidationSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
export type GuestSession = z.infer<typeof guestSessionSchema>;
