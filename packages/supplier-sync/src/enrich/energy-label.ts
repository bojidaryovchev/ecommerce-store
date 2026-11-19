import type { ProductKind } from "./fields";

/**
 * The EU energy label as a shop must show it online: an arrow in the colour of the product's class, with the class
 * in white at the price's size, next to the price; it opens the label, and a "product fiche" link sits beside it
 * (Regulation (EU) 2017/1369; the internet display rules that 518/2014 added to each product regulation).
 *
 * The scales: space and combination heaters (heat pumps and boilers, 811/2013), solid-fuel boilers (2015/1187)
 * and air conditioners (626/2011) run from A+++ to D; local space heaters (pellet stoves, 2015/1186, the label
 * from 2022) from A++ to G. Radiators, towel rails, fan coils and pumps carry no energy label.
 */
export const ENERGY_SCALES = {
  heaters: ["A+++", "A++", "A+", "A", "B", "C", "D"],
  localHeaters: ["A++", "A+", "A", "B", "C", "D", "E", "F", "G"],
} as const;
export type EnergyScale = keyof typeof ENERGY_SCALES;

/**
 * The arrows' colours by position in the scale, as the label annexes specify them (CMYK 100-0-100-0, 70-0-100-0,
 * 30-0-100-0, 0-0-100-0, 0-30-100-0, 0-70-100-0, and 0-100-100-0 for every class after the sixth), on screen.
 */
const ARROW_COLOURS = ["#00A651", "#50B848", "#BFD730", "#FFF200", "#FDB913", "#F37021", "#ED1C24"] as const;

/** The products the labelling rules cover, by kind, and the largest output they cover. */
const SCOPE: Partial<
  Record<ProductKind, { scale: EnergyScale; maxKw: number; output: "power-heating" | "cooling-power" }>
> = {
  heat_pump: { scale: "heaters", maxKw: 70, output: "power-heating" },
  boiler: { scale: "heaters", maxKw: 70, output: "power-heating" },
  // Air conditioners up to 12 kW of cooling.
  air_conditioner: { scale: "heaters", maxKw: 12, output: "cooling-power" },
  pellet_stove: { scale: "localHeaters", maxKw: 50, output: "power-heating" },
};

/** The class attributes, and what each is the class of. */
const CLASS_ATTRIBUTES = [
  { slug: "energy-class-cooling", function: "cooling" },
  { slug: "energy-class-heating", function: "heating" },
  { slug: "energy-class", function: null },
] as const;

export interface EnergyArrow {
  /** What the class is for, when the label has more than one (an air conditioner's cooling and heating). */
  function: "heating" | "cooling" | null;
  /** "A+++". */
  value: string;
  colour: string;
}

export interface EnergyLabelInfo {
  /** Whether the labelling rules cover this product (its kind, and its output within their limit). */
  required: boolean;
  arrows: EnergyArrow[];
}

/**
 * What the shop must show for a product: whether it needs a label at all, and the arrows for its classes. An output
 * the shop does not know counts as within the limit, so a product is never let off the label for lack of data.
 */
export function energyLabelInfo(
  kind: ProductKind | null,
  attributes: ReadonlyArray<{ slug: string; value: string; numericValue: number | null }>,
): EnergyLabelInfo {
  const scope = kind ? SCOPE[kind] : undefined;
  if (!scope) return { required: false, arrows: [] };
  const output = attributes.find((attribute) => attribute.slug === scope.output)?.numericValue ?? null;
  const required = output === null || output <= scope.maxKw;
  const scale: readonly string[] = ENERGY_SCALES[scope.scale];
  const arrows: EnergyArrow[] = [];
  for (const entry of CLASS_ATTRIBUTES) {
    const value = attributes
      .find((attribute) => attribute.slug === entry.slug)
      ?.value.trim()
      .toUpperCase();
    if (!value) continue;
    const position = scale.indexOf(value);
    // A class outside the product's scale is a data error, not something to draw.
    if (position < 0) continue;
    arrows.push({
      function: entry.function,
      value,
      colour: ARROW_COLOURS[Math.min(position, ARROW_COLOURS.length - 1)]!,
    });
  }
  return { required, arrows };
}

/** The registration number in an EPREL link ("https://eprel.ec.europa.eu/screen/product/airconditioners/123456"). */
export function eprelRegistration(url: string | null | undefined): string | null {
  const match = url?.match(/^https:\/\/eprel\.ec\.europa\.eu\/(?:screen\/)?product\/[a-z0-9]+\/(\d+)/i);
  return match?.[1] ?? null;
}
