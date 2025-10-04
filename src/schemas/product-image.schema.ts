import { z } from "zod";

/**
 * Product image creation/update schema
 * Validates product image data including URL and position
 */
export const productImageSchema = z.object({
  url: z.url("Image URL must be valid").max(2048, "Image URL must be less than 2048 characters"),

  alt: z.string().max(255, "Alt text must be less than 255 characters").trim().optional().nullable(),

  position: z.number().int("Position must be a whole number").min(0, "Position cannot be negative").default(0),

  productId: z.cuid("Invalid product ID"),
});

/**
 * Product image update schema - all fields optional except productId
 */
export const productImageUpdateSchema = productImageSchema.partial().required({ productId: true });

/**
 * Type inference for product image form data
 */
export type ProductImageFormData = z.infer<typeof productImageSchema>;
export type ProductImageUpdateFormData = z.infer<typeof productImageUpdateSchema>;
