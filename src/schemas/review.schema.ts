import { z } from "zod";

/**
 * Review creation/update schema
 * Validates product review data including rating and content
 */
export const reviewSchema = z.object({
  productId: z.cuid("Invalid product ID"),

  userId: z.cuid("Invalid user ID"),

  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),

  title: z.string().max(255, "Review title must be less than 255 characters").trim().optional().nullable(),

  comment: z.string().max(5000, "Review comment must be less than 5000 characters").trim().optional().nullable(),

  isVerifiedPurchase: z.boolean().default(false),
  isApproved: z.boolean().default(false),

  editedAt: z.date().optional().nullable(),
});

/**
 * Review update schema - allows updating rating, title, and comment
 */
export const reviewUpdateSchema = z
  .object({
    rating: z
      .number()
      .int("Rating must be a whole number")
      .min(1, "Rating must be at least 1 star")
      .max(5, "Rating cannot exceed 5 stars")
      .optional(),

    title: z.string().max(255, "Review title must be less than 255 characters").trim().optional().nullable(),

    comment: z.string().max(5000, "Review comment must be less than 5000 characters").trim().optional().nullable(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  });

/**
 * Review approval schema - for admin use
 */
export const reviewApprovalSchema = z.object({
  isApproved: z.boolean(),
});

/**
 * Type inference for review form data
 */
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>;
export type ReviewApprovalFormData = z.infer<typeof reviewApprovalSchema>;
