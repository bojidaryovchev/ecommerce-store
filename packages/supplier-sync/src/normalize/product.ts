import { createHash } from "node:crypto";
import type { WooProduct } from "../woocommerce/schemas";
import { detectBrand } from "./brand";
import { parseMeasurement, toAttributeUnit } from "./measurement";
import { cleanLabel, fixMixedScripts, htmlToText, safeDecodeURIComponent } from "./text";
import { slugify } from "./transliterate";

export type NormalizedImage = { id: number; src: string; alt: string | null };

export type NormalizedAttributeValue = { text: string; number: number | null; unit: string | null };

export type NormalizedAttribute = {
  /** WooCommerce taxonomy ("pa_color") or "local:<slug>" for product-specific attributes. */
  key: string;
  name: string;
  values: NormalizedAttributeValue[];
};

/** A supplier product in our terms. Everything the sync compares or writes comes from here. */
export type NormalizedProduct = {
  externalId: number;
  name: string;
  brand: string | null;
  description: string | null;
  permalink: string | null;
  sku: string | null;
  /** Minor units (cents), VAT included; null = no price ("price on request"). */
  priceAmount: number | null;
  regularPriceAmount: number | null;
  currency: string;
  inStock: boolean;
  onBackorder: boolean;
  /** Can be bought online: has a price and the supplier allows it. */
  purchasable: boolean;
  images: NormalizedImage[];
  categoryExternalIds: number[];
  attributes: NormalizedAttribute[];
};

/** Store API prices are strings in the currency's minor unit ("137026" = 1 370,26 €). */
export function toCents(raw: string, minorUnit: number): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const amount = Number(raw);
  const cents = minorUnit === 2 ? amount : Math.round(amount * 10 ** (2 - minorUnit));
  return cents > 0 ? cents : null;
}

export function attributeKey(attribute: { name: string; taxonomy: string | null }): string {
  return attribute.taxonomy ? attribute.taxonomy : `local:${slugify(cleanLabel(attribute.name))}`;
}

/** Slug for our attribute created from a supplier key: "pa_power-heating-btu" → "power-heating-btu". */
export function attributeSlugFromKey(key: string): string {
  const bare = key.startsWith("local:") ? key.slice("local:".length) : key.replace(/^pa_/, "");
  return slugify(safeDecodeURIComponent(bare)) || "attribute";
}

export function normalizeWooProduct(product: WooProduct): NormalizedProduct {
  const name = cleanLabel(product.name);
  const description = fixMixedScripts(htmlToText(product.description) || htmlToText(product.short_description)) || null;
  const priceAmount = toCents(product.prices.price, product.prices.currency_minor_unit);
  const regularPriceAmount = toCents(product.prices.regular_price, product.prices.currency_minor_unit);

  const seenImages = new Set<number>();
  const images: NormalizedImage[] = [];
  for (const image of product.images) {
    if (seenImages.has(image.id) || !image.src) continue;
    seenImages.add(image.id);
    images.push({ id: image.id, src: image.src, alt: cleanLabel(image.alt) || null });
  }

  const attributes: NormalizedAttribute[] = [];
  for (const attribute of product.attributes) {
    const attributeName = cleanLabel(attribute.name);
    const values: NormalizedAttributeValue[] = [];
    const seenValues = new Set<string>();
    for (const term of attribute.terms) {
      const text = cleanLabel(term.name);
      if (!text || seenValues.has(text)) continue;
      seenValues.add(text);
      const measurement = parseMeasurement(text);
      const inUnit = measurement ? toAttributeUnit(attributeName, measurement) : null;
      values.push({ text, number: inUnit?.value ?? null, unit: inUnit?.unit ?? null });
    }
    if (values.length > 0) {
      attributes.push({
        key: attributeKey({ name: attribute.name, taxonomy: attribute.taxonomy }),
        name: attributeName,
        values,
      });
    }
  }

  return {
    externalId: product.id,
    name,
    brand: detectBrand(name),
    description,
    permalink: product.permalink || null,
    sku: product.sku.trim() || null,
    priceAmount,
    regularPriceAmount,
    currency: product.prices.currency_code.toLowerCase(),
    inStock: product.is_in_stock,
    onBackorder: product.is_on_backorder,
    purchasable: product.is_purchasable && priceAmount !== null,
    images,
    categoryExternalIds: [...new Set(product.categories.map((category) => category.id))],
    attributes,
  };
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

/** Hash of the normalised product: equal hashes mean nothing we use has changed. */
export function hashNormalizedProduct(product: NormalizedProduct): string {
  return createHash("sha256").update(stableStringify(product)).digest("hex");
}

export function isSameValue(a: unknown, b: unknown): boolean {
  return stableStringify(a) === stableStringify(b);
}
