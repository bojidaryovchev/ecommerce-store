import { z } from "zod";

/**
 * The characteristics an admin fills in on the enrichment page (the ones nobody found, or that are contested).
 * An empty value removes the admin's value. The pipeline checks each value's type and unit (saveAdminFacts).
 */
export const characteristicsSchema = z.object({
  values: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string().trim().max(60, "Keep the value under 60 characters"),
      }),
    )
    .min(1),
});

export type CharacteristicsInput = z.infer<typeof characteristicsSchema>;
