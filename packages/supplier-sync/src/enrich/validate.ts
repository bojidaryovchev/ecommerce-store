import type { Confidence, ResearchAnswer, SpecSource } from "./contract";
import {
  ENERGY_CLASSES,
  KINDS,
  SPEC_FIELDS,
  formatSpecValue,
  isSpecKey,
  roundSpec,
  type ProductKind,
  type SpecField,
  type SpecKey,
} from "./fields";

/**
 * The validation gate: consistency checks on what the research extracted, before anything reaches a shopper.
 *
 *  - every value has the right type and lies in the range a real product of its kind has;
 *  - the figures in the product's NAME agree with the specs ("R32 Mono 5 kW" with 17.6 kW of heating does not);
 *  - values that contradict the supplier's attribute fields are settled by the name where it states the
 *    figure, and otherwise left to a person;
 *  - each kind has the fields it must have.
 *
 * `problems` stop the product (it goes to the review queue, nothing of it is published until a person
 * decides); `notices` are for the admin's information only.
 */

export interface ValidatedSpec {
  key: SpecKey;
  value: number | string | boolean;
  /** As the shop shows it: "4,65 kW". */
  text: string;
  numeric: number | null;
  condition: string | null;
  source: SpecSource;
  url: string | null;
  confidence: Confidence;
}

export interface SpecConflict {
  key: SpecKey;
  /** The supplier's value, as they show it. */
  supplier: string;
  found: string;
  /** "name": the product's name states the figure and agrees with what was found. "review": a person decides. */
  resolution: "name" | "review";
}

export interface ValidationResult {
  kind: ProductKind;
  specs: ValidatedSpec[];
  dropped: Array<{ key: string; value: unknown; reason: string }>;
  conflicts: SpecConflict[];
  problems: string[];
  notices: string[];
  /** Specs in doubt: the copy must not state them. */
  omit: SpecKey[];
  /** Supplier attribute slugs whose values the published specs replace. */
  supersede: string[];
  gtin: string | null;
  mpn: string | null;
}

export interface SupplierAttributeValue {
  slug: string;
  name: string;
  unit: string | null;
  value: string;
  numericValue: number | null;
}

export interface ValidateInput {
  /** The supplier's product name. */
  name: string;
  kind: ProductKind;
  categorySlug: string | null;
  research: ResearchAnswer;
  supplierAttributes: SupplierAttributeValue[];
}

const CONFIDENCE_RANK: Record<Confidence, number> = { high: 3, medium: 2, low: 1 };

/** Numbers in a name with an explicit unit: "5KW", "9000 BTU", "500 W", "12,5 kW". */
export function nameFigures(name: string): Array<{ value: number; unit: "kW" | "BTU/h" | "W" }> {
  const figures: Array<{ value: number; unit: "kW" | "BTU/h" | "W" }> = [];
  const pattern = /(\d+(?:[.,]\d+)?)\s*(kw|квт|btu(?:\/h)?|w|вт)(?![\p{L}\p{N}])/giu;
  for (const match of name.matchAll(pattern)) {
    const value = Number(match[1]!.replace(",", "."));
    const unit = match[2]!.toLowerCase();
    if (!Number.isFinite(value) || value <= 0) continue;
    figures.push({
      value,
      unit: unit === "kw" || unit === "квт" ? "kW" : unit.startsWith("btu") ? "BTU/h" : "W",
    });
  }
  return figures;
}

const parseNumber = (value: unknown): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const match = /^[^\d-]*(-?\d+(?:\s\d{3})*(?:[.,]\d+)?)/.exec(value.trim());
  if (!match) return null;
  const number = Number(match[1]!.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(number) ? number : null;
};

/** Brings a value to a field's unit where units are interchangeable (W and kW). */
export function convertUnit(value: number, from: string | null, to: string | null): number | null {
  const norm = (unit: string | null) => (unit ?? "").toLowerCase().replace(/[.\s]/g, "");
  const a = norm(from);
  const b = norm(to);
  if (a === b) return value;
  if ((a === "kw" || a === "квт") && (b === "w" || b === "вт")) return value * 1000;
  if ((a === "w" || a === "вт") && (b === "kw" || b === "квт")) return value / 1000;
  if (a === "" || b === "") return value;
  if ((a === "квм" || a === "m²" || a === "м²" || a === "m2") && (b === "м²" || b === "m²")) return value;
  if ((a === "мм" || a === "mm") && (b === "мм" || b === "mm")) return value;
  return null;
}

export function normalizeSpecValue(
  key: SpecKey,
  raw: unknown,
): { ok: true; value: number | string | boolean } | { ok: false; reason: string } {
  const field: SpecField = SPEC_FIELDS[key];
  switch (field.type) {
    case "number": {
      const number = parseNumber(raw);
      return number === null ? { ok: false, reason: "not a number" } : { ok: true, value: roundSpec(key, number) };
    }
    case "boolean": {
      if (typeof raw === "boolean") return { ok: true, value: raw };
      const text = String(raw).trim().toLowerCase();
      if (["да", "yes", "true"].includes(text)) return { ok: true, value: true };
      if (["не", "no", "false"].includes(text)) return { ok: true, value: false };
      return { ok: false, reason: "not yes or no" };
    }
    case "enum": {
      const text = String(raw).trim();
      const options = field.options ?? [];
      if (options === ENERGY_CLASSES) {
        const upper = text.toUpperCase().replace(/\s+/g, "");
        return (ENERGY_CLASSES as readonly string[]).includes(upper)
          ? { ok: true, value: upper }
          : { ok: false, reason: `not an energy class (${ENERGY_CLASSES.join(", ")})` };
      }
      if (key === "panelType") {
        const digits = /(\d{2})/.exec(text)?.[1];
        return digits && options.includes(digits) ? { ok: true, value: digits } : { ok: false, reason: "unknown type" };
      }
      if (key === "phase") {
        // Words first, then phase counts, then voltages: "230 V" holds a 3, "400V/3N" holds a 0.
        const exact = options.find((option) => option.toLowerCase() === text.toLowerCase());
        if (exact) return { ok: true, value: exact };
        const single = /моно|еднофаз|single|\b1\s*(?:ph|ф|фаза|~)|\b2[23]0\s*v?\b/i.test(text);
        const three = /три|three|\b3\s*(?:ph|ф|фази|n|~)|\b(?:380|400)\s*v?\b/i.test(text);
        if (single !== three) return { ok: true, value: single ? options[0]! : options[1]! };
        return { ok: false, reason: "neither clearly single- nor three-phase" };
      }
      const found = options.find((option) => option.toLowerCase() === text.toLowerCase());
      return found ? { ok: true, value: found } : { ok: false, reason: `not one of ${options.join(", ")}` };
    }
    case "text": {
      let text = String(raw).replace(/\s+/g, " ").trim();
      if (!text) return { ok: false, reason: "empty" };
      if (key === "refrigerant") {
        const match = /^R-?\s?(\d{2,4}[A-Z]?)$/i.exec(text);
        if (!match) return { ok: false, reason: "not a refrigerant designation" };
        text = `R${match[1]!.toUpperCase()}`;
      }
      if (key === "colour") text = text.charAt(0).toUpperCase() + text.slice(1);
      return text.length > 60 ? { ok: false, reason: "too long" } : { ok: true, value: text };
    }
  }
}

/** The tolerance between a figure in the name and the measured value, as a ratio of name to found. */
const NAME_TOLERANCE: Record<"kW" | "BTU/h" | "W", [number, number]> = {
  // A heat pump sold as "5 kW" gives 4.65 kW at A7/W35; one sold as 9 kW might give 9.5.
  kW: [0.7, 1.4],
  "BTU/h": [0.75, 1.3],
  W: [0.8, 1.25],
};

/** Which specs a figure of this unit in the name speaks for, in order of preference. */
const NAME_KEYS: Record<"kW" | "BTU/h" | "W", SpecKey[]> = {
  kW: ["heatingKw", "coolingKw"],
  "BTU/h": ["coolingBtu", "heatingBtu"],
  W: ["outputW", "electricPowerW"],
};

export function validateResearch(input: ValidateInput): ValidationResult {
  const { kind, research } = input;
  const config = KINDS[kind];
  const dropped: ValidationResult["dropped"] = [];
  const problems: string[] = [];
  const notices: string[] = [];
  const conflicts: SpecConflict[] = [];
  const omit = new Set<SpecKey>();
  const supersede = new Set<string>();

  // 1. Each value: a field of this kind, the right type, a plausible range; the most certain per field.
  const accepted = new Map<SpecKey, ValidatedSpec>();
  // An output brought to ΔT50, as it was rated: the supplier's own field states it that way (step 3).
  const asRated = new Map<ValidatedSpec, number>();
  for (const spec of research.specs) {
    if (!isSpecKey(spec.key) || !(spec.key in config.fields)) {
      dropped.push({ key: spec.key, value: spec.value, reason: `not a ${config.label.toLowerCase()} field` });
      continue;
    }
    if (spec.confidence === "low") {
      dropped.push({ key: spec.key, value: spec.value, reason: "low confidence" });
      continue;
    }
    let normalized = normalizeSpecValue(spec.key, spec.value);
    if (!normalized.ok) {
      dropped.push({ key: spec.key, value: spec.value, reason: normalized.reason });
      continue;
    }
    let condition = spec.condition?.trim() || null;
    let rated: number | null = null;
    // Water radiators and towel rails: one yardstick, the EN 442 output at ΔT50.
    if (
      spec.key === "outputW" &&
      typeof normalized.value === "number" &&
      (kind === "radiator" || kind === "towel_rail")
    ) {
      const converted = toDeltaT50(normalized.value, condition);
      if (converted) {
        notices.push(
          `Heat output ${formatSpecValue("outputW", normalized.value)} at ${condition} is ${formatSpecValue("outputW", converted)} at ΔT50 (EN 442, n = 1.3).`,
        );
        rated = normalized.value;
        normalized = { ok: true, value: converted };
        condition = `ΔT50, from ${condition}`;
      }
    }
    const field: SpecField = SPEC_FIELDS[spec.key];
    const range = config.fields[spec.key];
    if (range && typeof normalized.value === "number") {
      const [min, max] = range;
      if (normalized.value < min || normalized.value > max) {
        const shown = formatSpecValue(spec.key, normalized.value);
        dropped.push({ key: spec.key, value: spec.value, reason: `outside ${min}–${max}` });
        problems.push(
          `${field.name} ${shown} is outside the range of a real ${config.label.toLowerCase()} (${min}–${max}${field.unit ? ` ${field.unit}` : ""}).`,
        );
        continue;
      }
    }
    const candidate: ValidatedSpec = {
      key: spec.key,
      value: normalized.value,
      text: formatSpecValue(spec.key, normalized.value),
      numeric: typeof normalized.value === "number" ? normalized.value : null,
      condition,
      source: spec.source,
      url: spec.url && /^https?:\/\//i.test(spec.url) ? spec.url : null,
      confidence: spec.confidence,
    };
    if (rated !== null) asRated.set(candidate, rated);
    const existing = accepted.get(spec.key);
    if (!existing) {
      accepted.set(spec.key, candidate);
      continue;
    }
    const differ =
      existing.numeric !== null && candidate.numeric !== null
        ? Math.abs(existing.numeric - candidate.numeric) / Math.max(Math.abs(existing.numeric), 1e-9) > 0.05
        : String(existing.value).toLowerCase() !== String(candidate.value).toLowerCase();
    if (differ)
      notices.push(
        `${field.name}: two values were found (${existing.text} and ${candidate.text}); kept the more certain.`,
      );
    if (CONFIDENCE_RANK[candidate.confidence] > CONFIDENCE_RANK[existing.confidence]) {
      accepted.set(spec.key, candidate);
    }
  }

  // 2. The name against the specs.
  const nameChecked = new Map<SpecKey, boolean>();
  const figures = nameFigures(input.name);
  for (const figure of figures) {
    const key = NAME_KEYS[figure.unit].find((candidate) => accepted.has(candidate));
    if (!key) {
      // A BTU figure with only kW known: compare through the conversion.
      const coolingKw = accepted.get("coolingKw")?.numeric;
      if (figure.unit === "BTU/h" && coolingKw) {
        const ratio = figure.value / (coolingKw * 3412);
        if (ratio < NAME_TOLERANCE["BTU/h"][0] || ratio > NAME_TOLERANCE["BTU/h"][1]) {
          problems.push(
            `The name says ${figure.value} BTU, but the cooling capacity found is ${accepted.get("coolingKw")!.text}.`,
          );
        }
      }
      continue;
    }
    const spec = accepted.get(key)!;
    const found = convertUnit(spec.numeric ?? NaN, SPEC_FIELDS[key].unit, figure.unit);
    if (found === null || !Number.isFinite(found) || found <= 0) continue;
    const ratio = figure.value / found;
    const [low, high] = NAME_TOLERANCE[figure.unit];
    const agrees = ratio >= low && ratio <= high;
    nameChecked.set(key, agrees);
    if (!agrees) {
      problems.push(
        `The name says ${String(figure.value).replace(".", ",")} ${figure.unit}, but ${SPEC_FIELDS[key].name.toLowerCase()} found is ${spec.text}.`,
      );
      omit.add(key);
    }
  }
  const nominal = research.identity.nominal;
  if (nominal && figures.length === 0) {
    const key = NAME_KEYS[nominal.unit].find((candidate) => accepted.has(candidate));
    const spec = key ? accepted.get(key) : undefined;
    const found = spec ? convertUnit(spec.numeric ?? NaN, SPEC_FIELDS[spec.key].unit, nominal.unit) : null;
    if (spec && found && Number.isFinite(found)) {
      const ratio = nominal.value / found;
      const [low, high] = NAME_TOLERANCE[nominal.unit];
      if (ratio < low || ratio > high) {
        notices.push(`The model code suggests ${nominal.value} ${nominal.unit}, but ${spec.text} was found.`);
      } else {
        nameChecked.set(spec.key, true);
      }
    }
  }

  // 3. The supplier's attribute fields against what was found.
  for (const spec of accepted.values()) {
    const field: SpecField = SPEC_FIELDS[spec.key];
    const slugs = [field.attribute, ...(field.supersedes ?? [])];
    for (const attribute of input.supplierAttributes.filter((a) => slugs.includes(a.slug))) {
      supersede.add(attribute.slug);
      if (spec.numeric === null) {
        if (field.type === "text" && attribute.value.trim().toLowerCase() !== String(spec.value).toLowerCase()) {
          notices.push(`${field.name}: the supplier says “${attribute.value}”, the shop will show “${spec.text}”.`);
        }
        continue;
      }
      if (attribute.numericValue === null) continue;
      const theirs = convertUnit(attribute.numericValue, attribute.unit, field.unit);
      if (theirs === null) continue;
      const differs = (ours: number) =>
        Math.abs(theirs - ours) / Math.max(Math.abs(ours), Math.abs(theirs), 1e-9) > 0.15;
      if (!differs(spec.numeric)) continue;
      // The supplier gives a radiator's output at its own rating (90/75/18): it agrees with the figure as rated.
      const rated = asRated.get(spec);
      if (rated !== undefined && !differs(rated)) continue;
      const resolution = nameChecked.get(spec.key) === true ? "name" : "review";
      conflicts.push({ key: spec.key, supplier: attribute.value, found: spec.text, resolution });
      if (resolution === "review") {
        problems.push(`${field.name}: the supplier's field says ${attribute.value}, the research found ${spec.text}.`);
        omit.add(spec.key);
      } else {
        notices.push(
          `${field.name}: the supplier's ${attribute.value} is replaced by ${spec.text}, which the name confirms.`,
        );
      }
    }
  }

  // 4. Fields the kind must have.
  for (const group of config.required) {
    if (!group.some((key) => accepted.has(key))) {
      problems.push(`Missing ${group.map((key) => SPEC_FIELDS[key].name).join(" or ")}.`);
    }
  }

  // 5. Values that contradict each other.
  const value = (key: SpecKey) => accepted.get(key)?.numeric ?? null;
  const heating = value("heatingKw");
  const water = value("waterKw");
  if (heating !== null && water !== null && water > heating * 1.02) {
    problems.push(
      `The output to the water (${accepted.get("waterKw")!.text}) exceeds the total output (${accepted.get("heatingKw")!.text}).`,
    );
    omit.add("waterKw");
  }
  const coolingKw = value("coolingKw");
  const coolingBtu = value("coolingBtu");
  if (coolingKw !== null && coolingBtu !== null) {
    const ratio = coolingBtu / (coolingKw * 3412);
    if (ratio < 0.75 || ratio > 1.3) {
      notices.push(
        `Cooling ${accepted.get("coolingKw")!.text} and ${accepted.get("coolingBtu")!.text} do not match (1 kW ≈ 3412 BTU/h).`,
      );
    }
  }
  const area = value("areaM2");
  if (area !== null && heating !== null && area / heating > 50) {
    notices.push(
      `${accepted.get("areaM2")!.text} for ${accepted.get("heatingKw")!.text} is over 50 m² per kW: check the area claim.`,
    );
  }

  // 6. Identifiers.
  let gtin: string | null = null;
  if (research.gtin) {
    const digits = research.gtin.replace(/\D/g, "");
    if (isValidGtin(digits)) gtin = digits;
    else notices.push(`GTIN “${research.gtin}” was dropped: not a valid barcode number.`);
  }
  const mpn = research.mpn?.trim() || research.identity.model?.trim() || null;

  // 7. Business notice: the EU F-gas rules.
  const refrigerant = accepted.get("refrigerant")?.value;
  if (
    kind === "heat_pump" &&
    typeof refrigerant === "string" &&
    HIGH_GWP.has(refrigerant) &&
    heating !== null &&
    heating <= 12 &&
    (input.categorySlug === "monoblok" || /mono/i.test(input.name))
  ) {
    notices.push(
      `F-gas: from 1 January 2027 the EU bans placing on the market self-contained (monoblock) heat pumps up to 12 kW that use refrigerants with GWP 150 or more, such as ${refrigerant} (Regulation (EU) 2024/573). Check stock and listing plans.`,
    );
  }

  return {
    kind,
    specs: [...accepted.values()].sort((a, b) => SPEC_FIELDS[a.key].sortOrder - SPEC_FIELDS[b.key].sortOrder),
    dropped,
    conflicts,
    problems: [...new Set(problems)],
    notices: [...new Set(notices)],
    omit: [...omit],
    supersede: [...supersede],
    gtin,
    mpn,
  };
}

/**
 * A radiator's output at another temperature difference, brought to ΔT50 (EN 442: Q = Q50 × (ΔT / 50)^n, with
 * the usual exponent n = 1.3). The condition is a ΔT ("ΔT60") or flow/return/room temperatures ("90/70/20").
 * Null when the condition is ΔT50 already, or unreadable.
 */
export function toDeltaT50(watts: number, condition: string | null): number | null {
  if (!condition) return null;
  const text = condition.replace(/\s+/g, "").replace(/°c|°|c\b/gi, "");
  const delta = /(?:Δ|delta|d)t=?(\d{2}(?:[.,]\d)?)/i.exec(text);
  const triple = /(\d{2,3})\/(\d{2,3})\/(\d{1,2})/.exec(text);
  const dt = delta
    ? Number(delta[1]!.replace(",", "."))
    : triple
      ? (Number(triple[1]) + Number(triple[2])) / 2 - Number(triple[3])
      : null;
  if (dt === null || !Number.isFinite(dt) || dt < 20 || dt > 90 || Math.abs(dt - 50) < 0.5) return null;
  return Math.round(watts * Math.pow(50 / dt, 1.3));
}

/** Refrigerants with a GWP of 150 or more that heat pumps commonly use. */
const HIGH_GWP = new Set(["R32", "R410A", "R407C", "R134A", "R454B", "R452B", "R513A"]);

/** GTIN-8/12/13/14 with a valid check digit. */
export function isValidGtin(digits: string): boolean {
  if (!/^(\d{8}|\d{12}|\d{13}|\d{14})$/.test(digits)) return false;
  const numbers = [...digits].map(Number);
  const check = numbers.pop()!;
  const sum = numbers.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === check;
}
