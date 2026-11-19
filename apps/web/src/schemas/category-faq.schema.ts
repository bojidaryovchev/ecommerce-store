import { z } from "zod";

/** A category page's questions as the admin writes them (in Bulgarian, as the page shows them). */
export const categoryFaqSchema = z.object({
  items: z
    .array(
      z.object({
        question: z
          .string()
          .trim()
          .min(8, "Write the question out")
          .max(160, "Keep the question under 160 characters")
          .refine((question) => question.endsWith("?"), "End the question with a question mark"),
        answer: z.string().trim().min(20, "Write the answer out").max(900, "Keep the answer under 900 characters"),
      }),
    )
    .max(8, "At most eight questions"),
  /** For a category without its own description: the page's introduction and meta description (empty: none). */
  intro: z.string().trim().max(800, "Keep the introduction under 800 characters"),
  metaDescription: z.string().trim().max(200, "Keep the meta description under 200 characters"),
});

export type CategoryFaqInput = z.infer<typeof categoryFaqSchema>;
