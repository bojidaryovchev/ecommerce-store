import { z } from "zod";
import { CONFIDENCES, IMAGE_KINDS, NOMINAL_UNITS, SPEC_SOURCES } from "./contract";
import { PRODUCT_KINDS, SPEC_KEYS, type SpecKey } from "./fields";

/**
 * What each stage stores in `product_enrichment.output`, and readers that parse it back defensively (rows
 * written by an older version of the pipeline read as missing, never as a crash).
 */

const specKey = z.enum(SPEC_KEYS as [SpecKey, ...SpecKey[]]);

export const extractOutputSchema = z.object({
  kind: z.enum(PRODUCT_KINDS),
  identity: z.object({
    brand: z.string().nullable(),
    model: z.string().nullable(),
    nominal: z.object({ value: z.number(), unit: z.enum(NOMINAL_UNITS) }).nullable(),
  }),
  gtin: z.string().nullable(),
  mpn: z.string().nullable(),
  specs: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.number(), z.string(), z.boolean()]),
      condition: z.string().nullable(),
      source: z.enum(SPEC_SOURCES),
      url: z.string().nullable(),
      confidence: z.enum(CONFIDENCES),
    }),
  ),
  features: z.array(z.string()),
  sources: z.array(z.string()),
  note: z.string(),
});
export type ExtractOutput = z.infer<typeof extractOutputSchema>;

export const classifyOutputSchema = z.object({
  kind: z.enum(PRODUCT_KINDS),
  /** A category for a product that had none. */
  category: z.object({ slug: z.string(), name: z.string(), reason: z.string() }).nullable(),
  images: z.array(
    z.object({
      url: z.string(),
      kind: z.enum(IMAGE_KINDS),
      label: z.string().nullable(),
      /** A picture of a different model or size than this product: not for its gallery. */
      otherModel: z.boolean().optional(),
    }),
  ),
});
export type ClassifyOutput = z.infer<typeof classifyOutputSchema>;

const validatedSpecSchema = z.object({
  key: specKey,
  value: z.union([z.number(), z.string(), z.boolean()]),
  text: z.string(),
  numeric: z.number().nullable(),
  condition: z.string().nullable(),
  source: z.enum(SPEC_SOURCES),
  url: z.string().nullable(),
  confidence: z.enum(CONFIDENCES),
});

export const validateOutputSchema = z.object({
  kind: z.enum(PRODUCT_KINDS),
  specs: z.array(validatedSpecSchema),
  dropped: z.array(z.object({ key: z.string(), value: z.unknown(), reason: z.string() })),
  conflicts: z.array(
    z.object({ key: specKey, supplier: z.string(), found: z.string(), resolution: z.enum(["name", "review"]) }),
  ),
  problems: z.array(z.string()),
  notices: z.array(z.string()),
  omit: z.array(specKey),
  supersede: z.array(z.string()),
  gtin: z.string().nullable(),
  mpn: z.string().nullable(),
});
export type ValidateOutput = z.infer<typeof validateOutputSchema>;

export const rewriteOutputSchema = z.object({
  name: z.string(),
  metaDescription: z.string(),
  description: z.string(),
});
export type RewriteOutput = z.infer<typeof rewriteOutputSchema>;

export const reviewOutputSchema = z.object({
  verdict: z.enum(["pass", "revise", "hold"]),
  issues: z.array(z.string()),
  /** The searched phrases the copy was checked against (keywords.ts), for the admin. */
  keywords: z.object({ primary: z.string(), volume: z.number(), secondary: z.array(z.string()) }).nullable(),
});
export type ReviewOutput = z.infer<typeof reviewOutputSchema>;

const reader =
  <T>(schema: z.ZodType<T>) =>
  (value: unknown): T | null => {
    const parsed = schema.safeParse(value);
    return parsed.success ? parsed.data : null;
  };

export const readExtract = reader(extractOutputSchema);
export const readClassify = reader(classifyOutputSchema);
export const readValidate = reader(validateOutputSchema);
export const readRewrite = reader(rewriteOutputSchema);
export const readReview = reader(reviewOutputSchema);
