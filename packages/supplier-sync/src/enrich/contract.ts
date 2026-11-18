import { z } from "zod";
import { PRODUCT_KINDS, SPEC_KEYS, type FieldType, type ProductKind, type SpecKey } from "./fields";
import type { KeywordTarget } from "./keywords";

/**
 * What the enrichment pipeline hands the model, and what it accepts back.
 *
 * Three kinds of session, each with its own skill (.claude/skills/catalog-research, catalog-copy, catalog-review):
 *
 * - research: reads the supplier's text, attributes and images (spec tables are often pictures), searches the
 *   web for the exact model, and returns typed specifications with sources, the product's kind and category,
 *   and what each image shows. Feeds the extract and classify stages.
 * - copy: writes the shop's own name, description and meta description from facts that passed validation, around
 *   the phrases people search for.
 * - review: a second reader checks that copy against the same facts, the searched phrases and the shop's rules,
 *   and passes it, sends it back with notes, or holds it for a person.
 *
 * The CLI holds the model to the JSON Schema generated here (shape and limits); each product's answer is then
 * parsed on its own, so one product's slip costs that product, not the batch.
 */

export const IMAGE_KINDS = [
  "photo",
  "icon",
  "badge",
  "energy_label",
  "spec_table",
  "diagram",
  "logo",
  "other",
] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export const CONFIDENCES = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

/** Where a value came from: the supplier's text, their attribute fields, their images, or a web page. */
export const SPEC_SOURCES = ["supplier_text", "supplier_attribute", "supplier_image", "web"] as const;
export type SpecSource = (typeof SPEC_SOURCES)[number];

export const NOMINAL_UNITS = ["kW", "BTU/h", "W"] as const;

export const LIMITS = {
  specs: 40,
  condition: 60,
  url: 600,
  features: 8,
  feature: 80,
  images: 40,
  label: 40,
  sources: 12,
  note: 1500,
  reason: 300,
  identity: 80,
} as const;

/* --- Research ------------------------------------------------------------------------------------------- */

export interface FieldBrief {
  key: SpecKey;
  name: string;
  unit: string | null;
  type: FieldType;
  options?: readonly string[];
  hint: string;
}

export interface ResearchImage {
  url: string;
  /** The image, downloaded and resized, relative to the workspace; null when it is known or could not be fetched. */
  file: string | null;
  /** The original's size in pixels, "1200x800", when known. */
  size: string | null;
  /** Set when this image was classified before (it is shared with products already done). */
  known: { kind: ImageKind; label: string | null } | null;
}

export interface ResearchItem {
  /** Our product id; the model echoes it back. */
  id: string;
  /** The supplier's name for it. */
  name: string;
  brand: string | null;
  sku: string | null;
  /** Our category, when it has one. */
  category: { slug: string; name: string } | null;
  /** The kind its category implies; null when the model must decide (no category). */
  kind: ProductKind | null;
  /** Products with the same family share the supplier's text: research the family once. */
  family: string;
  /** The supplier's description: a source of facts, never of wording. */
  supplierDescription: string | null;
  /** The supplier's attribute fields, as they show them. Known to contain errors. */
  supplierAttributes: Array<{ name: string; value: string }>;
  images: ResearchImage[];
  task: {
    /** Search the web for the exact model's datasheet. */
    research: boolean;
    /** It has no category: choose one from `categories`. */
    chooseCategory: boolean;
  };
}

export interface ResearchBatch {
  /** Format version, so a skill and a runner can disagree loudly. */
  version: 1;
  /** The fields to extract, per kind present in the batch. */
  fieldsByKind: Partial<Record<ProductKind, FieldBrief[]>>;
  /** Our categories, when some product must be given one. */
  categories: Array<{ slug: string; name: string; kind: ProductKind }>;
  products: ResearchItem[];
}

const nullableText = (max: number) => z.string().max(max).nullable();

export const researchSpecSchema = z
  .object({
    key: z.enum(SPEC_KEYS as [SpecKey, ...SpecKey[]]),
    value: z.union([z.number(), z.string(), z.boolean()]),
    /** The test condition the figure belongs to, when the source gives one ("A7/W35", "35 °C"). */
    condition: nullableText(LIMITS.condition),
    source: z.enum(SPEC_SOURCES),
    /** The page or image the value was read from. */
    url: nullableText(LIMITS.url),
    confidence: z.enum(CONFIDENCES),
  })
  .strict();
export type ResearchSpec = z.infer<typeof researchSpecSchema>;

export const researchProductSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(PRODUCT_KINDS),
    /** Only for a product without a category (or one that is plainly in the wrong one). */
    category: z
      .object({ slug: z.string().min(1).max(80), reason: z.string().max(LIMITS.reason) })
      .strict()
      .nullable(),
    identity: z
      .object({
        brand: nullableText(LIMITS.identity),
        /** The manufacturer's model designation: "MHP 5RP24", "Easy S8". */
        model: nullableText(LIMITS.identity),
        /** The output its name or model code states, if any: "R32 Mono 5 kW" → 5 kW. */
        nominal: z
          .object({ value: z.number().positive(), unit: z.enum(NOMINAL_UNITS) })
          .strict()
          .nullable(),
      })
      .strict(),
    gtin: nullableText(14),
    mpn: nullableText(LIMITS.identity),
    specs: z.array(researchSpecSchema).max(LIMITS.specs),
    /** Short Bulgarian phrases for real features ("Вграден Wi-Fi модул"), from the text or the icons. */
    features: z.array(z.string().min(1).max(LIMITS.feature)).max(LIMITS.features),
    images: z
      .array(
        z
          .object({
            url: z.string().min(1).max(LIMITS.url),
            kind: z.enum(IMAGE_KINDS),
            label: nullableText(LIMITS.label),
            /** It shows a different model or size than this product (the supplier reuses a range's photos). */
            otherModel: z.boolean(),
          })
          .strict(),
      )
      .max(LIMITS.images),
    /** The web pages actually used. */
    sources: z.array(z.string().max(LIMITS.url)).max(LIMITS.sources),
    /** For the admin, in English: what was found, what disagrees, how sure. */
    note: z.string().max(LIMITS.note),
  })
  .strict();
export type ResearchAnswer = z.infer<typeof researchProductSchema>;

export const researchOutputSchema = z.object({ products: z.array(researchProductSchema) }).strict();

/* --- Copy ----------------------------------------------------------------------------------------------- */

export interface CopyItem {
  id: string;
  /** The name it has now (often the supplier's, sometimes a bare model code). */
  currentName: string;
  brand: string | null;
  /** The manufacturer's model designation, from research. */
  model: string | null;
  kind: ProductKind;
  /** Our category's name. */
  category: string | null;
  /** The shop's own notes for its section of the catalogue: sizing, installing, guides. */
  sectionNotes: string | null;
  /** Validated specifications, as the shop shows them. */
  specs: Array<{ name: string; value: string }>;
  features: string[];
  /** Figures that are in doubt: the copy must not state them. */
  omit: string[];
  /** The supplier's description: facts only, never its wording. */
  supplierDescription: string | null;
  /** Names of related products, so the copy says what sets this one apart. */
  siblings: string[];
  /** The searched phrases the page is written around (keywords.ts); null when none has measurable demand. */
  keywords: KeywordTarget | null;
  /** Why the previous attempt was refused, when this is a retry. */
  retry: string[] | null;
}

export interface CopyBatch {
  version: 1;
  products: CopyItem[];
}

export const copyProductSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(4).max(140),
    metaDescription: z.string().min(40).max(220),
    description: z.string().min(100).max(7000),
  })
  .strict();
export type CopyAnswer = z.infer<typeof copyProductSchema>;

export const copyOutputSchema = z.object({ products: z.array(copyProductSchema) }).strict();

/* --- Review --------------------------------------------------------------------------------------------- */

export interface ReviewItem {
  id: string;
  kind: ProductKind;
  category: string | null;
  /** The shop's notes for its section (sizing rules of thumb the copy may use). */
  sectionNotes: string | null;
  /** The facts the copy may state: validated specifications and features. */
  specs: Array<{ name: string; value: string }>;
  features: string[];
  /** Figures in doubt: the copy must not state them. */
  omit: string[];
  /** Why the data checks held the product, when they did; the copy must not paper over it. */
  held: string[];
  /** Related products the shop sells (other sizes of the range): the copy may point to them by name. */
  siblings: string[];
  keywords: KeywordTarget | null;
  copy: { name: string; metaDescription: string; description: string };
}

export interface ReviewBatch {
  version: 1;
  products: ReviewItem[];
}

export const REVIEW_VERDICTS = ["pass", "revise", "hold"] as const;
export type ReviewVerdict = (typeof REVIEW_VERDICTS)[number];

export const reviewProductSchema = z
  .object({
    id: z.string().min(1),
    verdict: z.enum(REVIEW_VERDICTS),
    /** For "revise": what the writer must change, one point each; for "hold": why a person must look. */
    issues: z.array(z.string().min(3).max(400)).max(8),
  })
  .strict();
export type ReviewAnswer = z.infer<typeof reviewProductSchema>;

export const reviewOutputSchema = z.object({ products: z.array(reviewProductSchema) }).strict();

/* --- Shared --------------------------------------------------------------------------------------------- */

/** The JSON Schema the CLI enforces (`claude -p --json-schema`). */
export function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  const generated = z.toJSONSchema(schema, { target: "draft-7" }) as Record<string, unknown>;
  delete generated.$schema;
  return generated;
}

export const RESEARCH_OUTPUT_JSON_SCHEMA = jsonSchemaOf(researchOutputSchema);
export const COPY_OUTPUT_JSON_SCHEMA = jsonSchemaOf(copyOutputSchema);
export const REVIEW_OUTPUT_JSON_SCHEMA = jsonSchemaOf(reviewOutputSchema);

/** The envelope: per-product answers are parsed one by one. */
const envelopeSchema = z.object({ products: z.array(z.unknown()) });

export type ParsedAnswers<T> = {
  answers: Map<string, T>;
  /** Product ids whose answer did not parse, with why. */
  invalid: Map<string, string>;
  /** Ids in the answer that were not asked for. */
  stray: string[];
};

/** Split a batch answer into per-product results, keeping only products that were asked for. */
export function parseAnswers<T extends { id: string }>(
  output: unknown,
  schema: z.ZodType<T>,
  askedIds: readonly string[],
): ParsedAnswers<T> {
  const asked = new Set(askedIds);
  const answers = new Map<string, T>();
  const invalid = new Map<string, string>();
  const stray: string[] = [];
  const envelope = envelopeSchema.safeParse(output);
  if (!envelope.success) {
    for (const id of askedIds) invalid.set(id, "the answer had no product list");
    return { answers, invalid, stray };
  }
  for (const raw of envelope.data.products) {
    const id = typeof (raw as { id?: unknown })?.id === "string" ? (raw as { id: string }).id : null;
    if (id === null || !asked.has(id)) {
      if (id !== null) stray.push(id);
      continue;
    }
    const parsed = schema.safeParse(raw);
    if (parsed.success) answers.set(id, parsed.data);
    else invalid.set(id, z.prettifyError(parsed.error).slice(0, 500));
  }
  for (const id of askedIds) {
    if (!answers.has(id) && !invalid.has(id)) invalid.set(id, "no answer for this product");
  }
  return { answers, invalid, stray };
}

export function isWebAddress(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
