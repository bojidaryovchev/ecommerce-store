import { z } from "zod";

/**
 * Category creation/update schema
 * Validates category data including hierarchical relationships
 */
export const categorySchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name must be less than 100 characters")
    .trim(),

  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens")
    .trim(),

  description: z.string().max(5000, "Description must be less than 5000 characters").trim().optional().nullable(),

  image: z.url("Image must be a valid URL").optional().nullable(),

  parentId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.cuid("Invalid parent category ID").optional().nullable()),
});

/**
 * Category update schema - all fields optional
 */
export const categoryUpdateSchema = categorySchema.partial();

/**
 * Type inference for category form data
 */
export type CategoryFormData = z.infer<typeof categorySchema>;
export type CategoryUpdateFormData = z.infer<typeof categoryUpdateSchema>;
