import { z } from "zod";

/**
 * Order item creation schema
 * Validates order item data including product snapshots
 */
export const orderItemSchema = z
  .object({
    orderId: z.cuid("Invalid order ID"),

    productId: z.cuid("Invalid product ID"),

    variantId: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || null)
      .pipe(z.cuid("Invalid variant ID").nullable()),

    // Snapshot data at time of order
    productName: z
      .string()
      .min(1, "Product name is required")
      .max(255, "Product name must be less than 255 characters")
      .trim(),

    productSlug: z
      .string()
      .min(1, "Product slug is required")
      .max(255, "Product slug must be less than 255 characters")
      .trim(),

    productImage: z
      .url("Product image must be a valid URL")
      .max(2048, "Product image URL must be less than 2048 characters")
      .optional()
      .nullable(),

    sku: z.string().max(100, "SKU must be less than 100 characters").trim().optional().nullable(),

    variantName: z.string().max(255, "Variant name must be less than 255 characters").trim().optional().nullable(),

    quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),

    unitPrice: z
      .number()
      .min(0, "Unit price must be zero or greater")
      .max(99999999.99, "Unit price is too large")
      .multipleOf(0.01, "Unit price must have at most 2 decimal places"),

    totalPrice: z
      .number()
      .min(0, "Total price must be zero or greater")
      .max(99999999.99, "Total price is too large")
      .multipleOf(0.01, "Total price must have at most 2 decimal places"),
  })
  .refine(
    (data) => {
      // Validate total price calculation
      const calculatedTotal = data.quantity * data.unitPrice;

      // Allow for small floating point differences (within 1 cent)
      return Math.abs(data.totalPrice - calculatedTotal) < 0.01;
    },
    {
      message: "Total price must equal quantity × unit price",
      path: ["totalPrice"],
    },
  );

/**
 * Type inference for order item form data
 */
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
