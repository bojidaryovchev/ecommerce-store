import { KINDS, SPEC_FIELDS, type SpecKey } from "./fields";
import type { ValidateOutput } from "./outputs";

/**
 * What a product still lacks, for the admin: the characteristics its kind needs that nobody found, and the figures
 * left out because the supplier and the research disagree. A value an admin typed in (a manual attribute value of
 * the field) settles either at once, before the next enrichment run picks it up.
 */
export interface ProductGaps {
  /** Each group needs one value ("Мощност охлаждане or Мощност охлаждане (BTU)"). */
  missing: Array<{ keys: SpecKey[]; label: string }>;
  contested: Array<{ key: SpecKey; label: string; supplier: string | null; found: string | null }>;
  /** Fields an admin has filled in, with their values. */
  filled: Array<{ key: SpecKey; label: string; value: string }>;
}

const fieldByAttribute = new Map<string, SpecKey>(
  (Object.entries(SPEC_FIELDS) as Array<[SpecKey, (typeof SPEC_FIELDS)[SpecKey]]>).map(([key, field]) => [
    field.attribute,
    key,
  ]),
);

export function productGaps(
  validate: ValidateOutput | null,
  attributes: ReadonlyArray<{ slug: string; value: string; source: string }>,
): ProductGaps {
  const filled = new Map<SpecKey, string>();
  for (const attribute of attributes) {
    const key = attribute.source === "manual" ? fieldByAttribute.get(attribute.slug) : undefined;
    if (key) filled.set(key, attribute.value);
  }
  const gaps: ProductGaps = {
    missing: [],
    contested: [],
    filled: [...filled].map(([key, value]) => ({ key, label: SPEC_FIELDS[key].name, value })),
  };
  if (!validate) return gaps;

  const found = new Set<SpecKey>(validate.specs.map((spec) => spec.key));
  for (const group of KINDS[validate.kind].required) {
    if (group.some((key) => found.has(key) || filled.has(key))) continue;
    gaps.missing.push({ keys: [...group], label: group.map((key) => SPEC_FIELDS[key].name).join(" or ") });
  }
  for (const key of validate.omit) {
    if (filled.has(key)) continue;
    const conflict = validate.conflicts.find((entry) => entry.key === key);
    gaps.contested.push({
      key,
      label: SPEC_FIELDS[key].name,
      supplier: conflict?.supplier ?? null,
      found: conflict?.found ?? validate.specs.find((spec) => spec.key === key)?.text ?? null,
    });
  }
  return gaps;
}
