import type { ProductMedia } from "@ecommerce/database/schema";
import { energyLabelInfo, eprelRegistration, kindOfCategory, type EnergyArrow } from "@ecommerce/supplier-sync/enrich";

/** The attributes the arrow reads: the classes and the outputs that decide whether a label is required. */
export const ENERGY_ATTRIBUTE_SLUGS = [
  "energy-class",
  "energy-class-heating",
  "energy-class-cooling",
  "power-heating",
  "cooling-power",
] as const;

export type EnergyLabelView = {
  arrows: EnergyArrow[];
  /** The label: an image of it (shown in a dialog), or an EPREL page or PDF (opened in a new tab). */
  label: string;
  /** The product fiche (product information sheet), when the shop has it. */
  fiche: string | null;
};

/**
 * What a product shows next to its price under the EU energy labelling rules (supplier-sync energy-label.ts):
 * the class arrow(s), the label they open and the product fiche. Null when there is nothing to show, either
 * because the rules do not cover the product or because the shop has no label for it yet: an arrow that opens
 * nothing does not meet the rules, so it is not drawn, and the admin panel lists the product as lacking its label.
 */
export function energyLabelOf(
  product: { media?: ProductMedia | null; metadata?: Record<string, string> | null },
  categorySlugs: ReadonlyArray<string | null | undefined>,
  attributes: ReadonlyArray<{ slug: string; value: string; numericValue: number | null }>,
): EnergyLabelView | null {
  const kind = categorySlugs.map((slug) => kindOfCategory(slug)).find((value) => value !== null) ?? null;
  const { arrows } = energyLabelInfo(kind, attributes);
  if (arrows.length === 0) return null;
  const fiche = product.metadata?.productFiche || null;
  const label =
    product.media?.labels?.[0] || product.metadata?.energyLabel || (eprelRegistration(fiche) ? fiche : null);
  return label ? { arrows, label, fiche } : null;
}
