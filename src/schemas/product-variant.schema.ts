import { z } from "zod";

/**
 * Variant Options Schema
 * Represents key-value pairs for variant attributes (e.g., Size: "Large", Color: "Red")
 */
export const variantOptionsSchema = z
  .record(z.string(), z.string())
  .optional()
  .nullable()
  .refine(
    (options) => {
      if (!options) return true;
      // Ensure option values are not empty strings
      return Object.values(options).every((value) => value.trim().length > 0);
    },
    { message: "Option values cannot be empty" },
  );

/**
 * Product variant creation/update schema
 * Validates variant data including pricing, inventory, and options
 */
export const productVariantSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),

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
  options: variantOptionsSchema,

  isActive: z.boolean().default(true),
});

/**
 * Product variant update schema - all fields optional except productId
 */
export const productVariantUpdateSchema = productVariantSchema.partial().required({ productId: true });

/**
 * Update variant with ID
 */
export const updateVariantSchema = z.object({
  id: z.string().cuid("Invalid variant ID"),
  name: z
    .string()
    .min(1, "Variant name is required")
    .max(255, "Variant name must be less than 255 characters")
    .trim()
    .optional(),
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
    .optional(),
  options: variantOptionsSchema,
  isActive: z.boolean().optional(),
});

/**
 * Delete Variant Schema
 */
export const deleteVariantSchema = z.object({
  id: z.string().cuid("Invalid variant ID"),
  productId: z.string().cuid("Invalid product ID"),
});

/**
 * Get Variants Schema
 */
export const getVariantsSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  includeInactive: z.boolean().default(false),
});

/**
 * Variant Option Type Schema
 * Represents a single option type with its possible values
 * Example: { name: "Size", values: ["Small", "Medium", "Large"] }
 */
export const variantOptionTypeSchema = z.object({
  name: z.string().min(1, "Option name is required").max(50, "Option name must be less than 50 characters").trim(),
  values: z
    .array(
      z.string().min(1, "Option value cannot be empty").max(50, "Option value must be less than 50 characters").trim(),
    )
    .min(1, "At least one option value is required")
    .max(50, "Maximum 50 option values allowed"),
});

/**
 * Bulk Generate Variants Schema
 * Used when generating multiple variants from option combinations
 */
export const bulkGenerateVariantsSchema = z.object({
  productId: z.string().cuid("Invalid product ID"),
  optionTypes: z
    .array(variantOptionTypeSchema)
    .min(1, "At least one option type is required")
    .max(5, "Maximum 5 option types allowed"),
  basePrice: z
    .number()
    .min(0, "Base price must be zero or greater")
    .max(99999999.99, "Base price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places")
    .optional()
    .nullable(),
  baseStockQuantity: z
    .number()
    .int("Stock quantity must be a whole number")
    .min(0, "Stock quantity cannot be negative")
    .default(0),
  autoGenerateSku: z.boolean().default(true),
  skuPattern: z.string().max(50, "SKU pattern must be less than 50 characters").optional(),
});

/**
 * Adjust Stock Schema
 */
export const adjustVariantStockSchema = z.object({
  id: z.string().cuid("Invalid variant ID"),
  adjustment: z
    .number()
    .int("Adjustment must be an integer")
    .refine((val) => val !== 0, "Adjustment cannot be zero"),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
});

/**
 * Bulk Adjust Stock Schema
 */
export const bulkAdjustStockSchema = z.object({
  adjustments: z
    .array(
      z.object({
        id: z.string().cuid("Invalid variant ID"),
        newQuantity: z
          .number()
          .int("Stock quantity must be a whole number")
          .min(0, "Stock quantity cannot be negative")
          .max(999999, "Stock quantity must be less than 1,000,000"),
      }),
    )
    .min(1, "At least one variant adjustment is required")
    .max(100, "Maximum 100 variants can be adjusted at once"),
  reason: z.string().max(200, "Reason must be less than 200 characters").optional(),
});

/**
 * Variant Availability Schema
 */
export const checkVariantAvailabilitySchema = z.object({
  variantId: z.string().cuid("Invalid variant ID"),
  requestedQuantity: z
    .number()
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .max(999, "Quantity must be less than 1,000"),
});

/**
 * Type inference for product variant form data
 */
export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
export type ProductVariantUpdateFormData = z.infer<typeof productVariantUpdateSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type DeleteVariantInput = z.infer<typeof deleteVariantSchema>;
export type GetVariantsInput = z.infer<typeof getVariantsSchema>;
export type VariantOptionType = z.infer<typeof variantOptionTypeSchema>;
export type BulkGenerateVariantsInput = z.infer<typeof bulkGenerateVariantsSchema>;
export type AdjustVariantStockInput = z.infer<typeof adjustVariantStockSchema>;
export type BulkAdjustStockInput = z.infer<typeof bulkAdjustStockSchema>;
export type CheckVariantAvailabilityInput = z.infer<typeof checkVariantAvailabilitySchema>;

/**
 * Helper function to validate variant options structure
 */
export function validateVariantOptions(options: unknown): boolean {
  try {
    variantOptionsSchema.parse(options);
    return true;
  } catch {
    return false;
  }
}

/**
 * Helper function to extract option values from variant options
 */
export function extractOptionValues(options: Record<string, string> | null | undefined): string[] {
  if (!options) return [];
  return Object.values(options);
}

/**
 * Helper function to format variant options for display
 * Example: { Size: "Large", Color: "Red" } => "Large / Red"
 */
export function formatVariantOptions(
  options: Record<string, string> | null | undefined,
  separator: string = " / ",
): string {
  if (!options) return "";
  return Object.values(options).join(separator);
}

/**
 * Helper function to compare variant options
 */
export function areOptionsEqual(
  options1: Record<string, string> | null | undefined,
  options2: Record<string, string> | null | undefined,
): boolean {
  if (!options1 && !options2) return true;
  if (!options1 || !options2) return false;

  const keys1 = Object.keys(options1).sort();
  const keys2 = Object.keys(options2).sort();

  if (keys1.length !== keys2.length) return false;
  if (keys1.join(",") !== keys2.join(",")) return false;

  return keys1.every((key) => options1[key] === options2[key]);
}
