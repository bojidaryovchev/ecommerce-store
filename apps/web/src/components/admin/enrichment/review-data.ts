import type { EnrichmentDetail } from "@/queries/enrichment";
import type { EnrichmentStage, EnrichmentStatus } from "@ecommerce/database/schema";
import { SPEC_FIELDS, isSpecKey } from "@ecommerce/supplier-sync/enrich";

/**
 * What the review page shows, worked out on the server: plain data for the client form, so none of the
 * pipeline's code reaches the browser.
 */
export type ReviewData = {
  productId: string;
  slug: string | null;
  supplierUrl: string | null;
  stages: Partial<Record<EnrichmentStage, EnrichmentStatus>>;
  locked: string[];
  current: { name: string; metaDescription: string | null; description: string | null; category: string | null };
  proposal: { name: string; metaDescription: string; description: string; model: string | null } | null;
  category: { name: string; slug: string; reason: string } | null;
  specs: Array<{
    key: string;
    name: string;
    value: string;
    condition: string | null;
    source: string;
    url: string | null;
    confidence: string;
    /** What the shop shows for this figure now. */
    current: string | null;
    conflict: { supplier: string; resolution: "name" | "review" } | null;
  }>;
  dropped: Array<{ name: string; value: string; reason: string }>;
  problems: string[];
  notices: string[];
  review: {
    verdict: "pass" | "revise" | "hold";
    issues: string[];
    keywords: { primary: string; volume: number; secondary: string[] } | null;
  } | null;
  note: string | null;
  sources: string[];
  features: string[];
  images: Array<{ url: string; kind: string | null; label: string | null; otherModel: boolean }>;
};

export function toReviewData(detail: EnrichmentDetail): ReviewData {
  const { product, validate, extract, classify, rewrite } = detail;
  const currentBySlug = new Map<string, string[]>();
  for (const attribute of product.attributes) {
    currentBySlug.set(attribute.slug, [...(currentBySlug.get(attribute.slug) ?? []), attribute.value]);
  }
  const classified = new Map((classify?.images ?? []).map((image) => [image.url, image]));
  const nameOf = (key: string) => (isSpecKey(key) ? SPEC_FIELDS[key].name : key);

  return {
    productId: product.id,
    slug: product.slug,
    supplierUrl: product.supplierUrl,
    stages: Object.fromEntries(
      Object.entries(detail.stages)
        .filter(([, row]) => row !== null)
        .map(([stage, row]) => [stage, row!.status]),
    ),
    locked: product.lockedFields,
    current: {
      name: product.name,
      metaDescription: product.metaDescription,
      description: product.description,
      category: product.category?.name ?? null,
    },
    proposal: rewrite ? { ...rewrite, model: detail.stages.rewrite?.model ?? null } : null,
    category: classify?.category ?? null,
    specs: (validate?.specs ?? []).map((spec) => {
      const field = SPEC_FIELDS[spec.key];
      const slugs = [field.attribute, ...(("supersedes" in field && field.supersedes) || [])];
      const current = slugs.flatMap((slug) => currentBySlug.get(slug) ?? []);
      const conflict = validate?.conflicts.find((entry) => entry.key === spec.key);
      return {
        key: spec.key,
        name: field.name,
        value: spec.text,
        condition: spec.condition,
        source: spec.source,
        url: spec.url,
        confidence: spec.confidence,
        current: current.length > 0 ? current.join(", ") : null,
        conflict: conflict ? { supplier: conflict.supplier, resolution: conflict.resolution } : null,
      };
    }),
    dropped: (validate?.dropped ?? []).map((entry) => ({
      name: nameOf(entry.key),
      value: String(entry.value),
      reason: entry.reason,
    })),
    problems: [
      ...(validate?.problems ?? []),
      ...(detail.stages.classify?.status === "flagged" ? detail.stages.classify.errors : []),
    ],
    notices: validate?.notices ?? [],
    /** The second reader's verdict on the proposed copy, and the searched phrases it was written around. */
    review: detail.review
      ? { verdict: detail.review.verdict, issues: detail.review.issues, keywords: detail.review.keywords }
      : null,
    note: extract?.note || null,
    sources: extract?.sources ?? [],
    features: extract?.features ?? [],
    images: product.images.map((image) => ({
      url: image.url,
      kind: classified.get(image.url)?.kind ?? image.kind,
      label: classified.get(image.url)?.label ?? image.label,
      otherModel: classified.get(image.url)?.otherModel ?? false,
    })),
  };
}
