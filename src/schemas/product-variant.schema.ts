import { z } from "zod";

/**
 * Product variant creation/update schema
 * Validates variant data including pricing, inventory, and options
 */
export const productVariantSchema = z.object({
  productId: z.cuid("Invalid product ID"),

  name: z.string().min(1, "Variant name is required").max(255, "Variant name must be less than 255 characters").trim(),

  sku: z.string().max(100, "SKU must be less than 100 characters").trim().optional().nullable(),

  barcode: z.string().max(100, "Barcode must be less than 100 characters").trim().optional().nullable(),

  price: z
    .number()
    .min(0, "Price must be zero or greater")
    .max(99999999.99, "Price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places")
    .optional()
    .nullable(),

  stockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .default(0),

  // Variant options stored as JSON (e.g., { "Size": "Large", "Color": "Blue" })
  options: z.record(z.string(), z.string()).optional().nullable(),

  isActive: z.boolean().default(true),
});

/**
 * Product variant update schema - all fields optional except productId
 */
export const productVariantUpdateSchema = productVariantSchema.partial().required({ productId: true });

/**
 * Type inference for product variant form data
 */
export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
export type ProductVariantUpdateFormData = z.infer<typeof productVariantUpdateSchema>;
