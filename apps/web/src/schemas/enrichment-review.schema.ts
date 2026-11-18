import { z } from "zod";

/**
 * The enrichment review form (admin): which parts of a proposal to publish, and the admin's corrections.
 * The same schema validates the form in the browser and the action on the server.
 */
export const enrichmentReviewSchema = z
  .object({
    parts: z.object({ copy: z.boolean(), specs: z.boolean(), category: z.boolean() }),
    name: z.string().trim(),
    metaDescription: z.string().trim(),
    description: z.string().trim(),
    specs: z.array(
      z.object({
        key: z.string().min(1),
        name: z.string(),
        value: z.string().trim(),
        include: z.boolean(),
      }),
    ),
  })
  .superRefine((input, context) => {
    if (!input.parts.copy && !input.parts.specs && !input.parts.category) {
      context.addIssue({ code: "custom", path: ["parts"], message: "Choose at least one part to publish" });
    }
    if (input.parts.copy) {
      if (input.name.length < 4 || input.name.length > 140) {
        context.addIssue({ code: "custom", path: ["name"], message: "4–140 characters" });
      }
      if (input.metaDescription.length < 50 || input.metaDescription.length > 200) {
        context.addIssue({ code: "custom", path: ["metaDescription"], message: "50–200 characters" });
      }
      if (input.description.length < 100) {
        context.addIssue({ code: "custom", path: ["description"], message: "At least 100 characters" });
      }
    }
    if (input.parts.specs) {
      input.specs.forEach((spec, index) => {
        if (spec.include && !spec.value) {
          context.addIssue({ code: "custom", path: ["specs", index, "value"], message: "Required" });
        }
      });
    }
  });

export type EnrichmentReviewInput = z.infer<typeof enrichmentReviewSchema>;
