import { z } from "zod";

/**
 * Product creation/update schema
 * Validates product data including pricing, inventory, shipping, and SEO
 */
export const productSchema = z
  .object({
    name: z
      .string()
      .min(1, "Product name is required")
      .max(255, "Product name must be less than 255 characters")
      .trim(),

    slug: z
      .string()
      .min(1, "Slug is required")
      .max(255, "Slug must be less than 255 characters")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
      .trim(),

    description: z.string().max(10000, "Description must be less than 10000 characters").trim().optional().nullable(),

    // Pricing - must be non-negative
    price: z
      .number()
      .min(0, "Price must be zero or greater")
      .max(99999999.99, "Price is too large")
      .multipleOf(0.01, "Price must have at most 2 decimal places"),

    compareAtPrice: z
      .number()
      .min(0, "Compare at price must be zero or greater")
      .max(99999999.99, "Compare at price is too large")
      .multipleOf(0.01, "Compare at price must have at most 2 decimal places")
      .optional()
      .nullable(),

    costPrice: z
      .number()
      .min(0, "Cost price must be zero or greater")
      .max(99999999.99, "Cost price is too large")
      .multipleOf(0.01, "Cost price must have at most 2 decimal places")
      .optional()
      .nullable(),

    sku: z.string().max(100, "SKU must be less than 100 characters").trim().optional().nullable(),

    barcode: z.string().max(100, "Barcode must be less than 100 characters").trim().optional().nullable(),

    // Inventory
    trackInventory: z.boolean().optional().default(true),

    stockQuantity: z
      .number()
      .int("Stock quantity must be a whole number")
      .min(0, "Stock quantity cannot be negative")
      .optional()
      .default(0),

    lowStockThreshold: z
      .number()
      .int("Low stock threshold must be a whole number")
      .min(0, "Low stock threshold cannot be negative")
      .optional()
      .nullable(),

    // Shipping - all dimensions and weight must be non-negative
    weight: z
      .number()
      .min(0, "Weight must be zero or greater")
      .max(99999999.99, "Weight is too large")
      .multipleOf(0.01, "Weight must have at most 2 decimal places")
      .optional()
      .nullable(),

    length: z
      .number()
      .min(0, "Length must be zero or greater")
      .max(99999999.99, "Length is too large")
      .multipleOf(0.01, "Length must have at most 2 decimal places")
      .optional()
      .nullable(),

    width: z
      .number()
      .min(0, "Width must be zero or greater")
      .max(99999999.99, "Width is too large")
      .multipleOf(0.01, "Width must have at most 2 decimal places")
      .optional()
      .nullable(),

    height: z
      .number()
      .min(0, "Height must be zero or greater")
      .max(99999999.99, "Height is too large")
      .multipleOf(0.01, "Height must have at most 2 decimal places")
      .optional()
      .nullable(),

    requiresShipping: z.boolean().optional().default(true),

    // Status
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),

    // Relations
    categoryId: z
      .string()
      .optional()
      .nullable()
      .transform((val) => val || null)
      .pipe(z.cuid("Invalid category ID").nullable()),

    // SEO
    metaTitle: z.string().max(255, "Meta title must be less than 255 characters").trim().optional().nullable(),

    metaDescription: z
      .string()
      .max(500, "Meta description must be less than 500 characters")
      .trim()
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // If compareAtPrice is provided, it should be greater than price
      if (data.compareAtPrice !== null && data.compareAtPrice !== undefined) {
        return data.compareAtPrice >= data.price;
      }
      return true;
    },
    {
      message: "Compare at price should be greater than or equal to the regular price",
      path: ["compareAtPrice"],
    },
  );

/**
 * Product update schema - all fields optional
 */
export const productUpdateSchema = productSchema.partial();

/**
 * Type inference for product form data
 */
export type ProductFormData = z.input<typeof productSchema>;
export type ProductUpdateFormData = z.input<typeof productUpdateSchema>;
