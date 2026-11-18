import { z } from "zod";

/**
 * A product review, checked the same way in the browser (React Hook Form) and in the action. A rating without
 * words helps nobody choose, and Google shows reviews only with a comment. Each message is the key of its text
 * under `products.reviewForm.errors`.
 */
export const reviewSchema = z.object({
  rating: z.number().int().min(1, "rating").max(5, "rating"),
  content: z.string().trim().min(10, "content").max(2000, "content"),
});

export type ReviewInput = z.input<typeof reviewSchema>;

/** Why the action refused, as keys under `products.reviewForm.errors`. */
export type ReviewError = "signIn" | "rating" | "content" | "notPurchased" | "duplicate" | "failed";
