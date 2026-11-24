/**
 * Catalog filters as they appear in the URL, shared by the server (queries) and the client (sidebar).
 *
 *   ?q=камина&brand=Artel,Ocean&f.color=Бял&r.power-heating=6-12&minPrice=100&maxPrice=900&inStock=1&sort=price-asc&page=2
 *
 * - `brand`: brand names, comma-separated in one parameter, in a fixed order (Google: each key once, so
 *   Googlebot doesn't drop a value; one URL per selection). Brand pages are the crawlable filter.
 * - `f.<attribute>` (repeatable): exact attribute values (checkbox facets)
 * - `r.<attribute>`: numeric range "min-max", either end optional ("6-", "-12")
 * - `minPrice` / `maxPrice`: euros
 */

export const CATALOG_SORTS = ["relevance", "newest", "price-asc", "price-desc", "name-asc", "name-desc"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export type NumericRange = { min?: number; max?: number };

export type CatalogFilters = {
  query?: string;
  /** Includes every subcategory. */
  categoryId?: string;
  brands: string[];
  values: Record<string, string[]>;
  ranges: Record<string, NumericRange>;
  /** Cents. */
  minPrice?: number;
  /** Cents. */
  maxPrice?: number;
  inStock: boolean;
  sort?: CatalogSort;
  page: number;
};

export type SearchParamsInput = Record<string, string | string[] | undefined>;

export const VALUE_PREFIX = "f.";
export const RANGE_PREFIX = "r.";
export const CATALOG_PAGE_SIZE = 24;

const list = (value: string | string[] | undefined): string[] =>
  (Array.isArray(value) ? value : value === undefined ? [] : [value]).map((v) => v.trim()).filter(Boolean);

/** The brands named in a `brand` parameter (or in repeated ones, from older links), in URL order. */
export function splitBrands(value: string | string[] | undefined): string[] {
  return list(value).flatMap((v) =>
    v
      .split(",")
      .map((brand) => brand.trim())
      .filter(Boolean),
  );
}

/**
 * Brands as one `brand` value: each once, in a fixed order, so one selection has one URL. Brand names
 * contain no commas (attribute values can, "2,5", which is why `f.` filters stay repeatable).
 */
export function joinBrands(brands: Iterable<string>): string {
  return [...new Set(brands)].sort((a, b) => a.localeCompare(b, "bg")).join(",");
}

/** A query string with literal commas: `brand=Artel,Ocean`, not `brand=Artel%2COcean` (both parse the same). */
export function queryString(params: URLSearchParams): string {
  return params.toString().replace(/%2C/gi, ",");
}

const euroToCents = (value: string | undefined): number | undefined => {
  if (!value) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : undefined;
};

export function parseRange(value: string | undefined): NumericRange | null {
  const match = value ? /^(\d+(?:\.\d+)?)?-(\d+(?:\.\d+)?)?$/.exec(value) : null;
  if (!match || (match[1] === undefined && match[2] === undefined)) return null;
  return {
    ...(match[1] !== undefined && { min: Number(match[1]) }),
    ...(match[2] !== undefined && { max: Number(match[2]) }),
  };
}

export function formatRange(range: NumericRange): string {
  return `${range.min ?? ""}-${range.max ?? ""}`;
}

export function parseCatalogFilters(params: SearchParamsInput, fixed: { categoryId?: string } = {}): CatalogFilters {
  const first = (key: string) => list(params[key])[0];
  const values: Record<string, string[]> = {};
  const ranges: Record<string, NumericRange> = {};

  for (const [key, raw] of Object.entries(params)) {
    if (key.startsWith(VALUE_PREFIX) && key.length > VALUE_PREFIX.length) {
      const selected = list(raw);
      if (selected.length > 0) values[key.slice(VALUE_PREFIX.length)] = [...new Set(selected)];
    } else if (key.startsWith(RANGE_PREFIX) && key.length > RANGE_PREFIX.length) {
      const range = parseRange(list(raw)[0]);
      if (range) ranges[key.slice(RANGE_PREFIX.length)] = range;
    }
  }

  const sort = first("sort");
  const page = Number(first("page") ?? "1");
  const query = first("q");

  return {
    ...(query && { query }),
    ...((fixed.categoryId ?? first("category")) && { categoryId: fixed.categoryId ?? first("category") }),
    brands: [...new Set(splitBrands(params.brand))],
    values,
    ranges,
    minPrice: euroToCents(first("minPrice")),
    maxPrice: euroToCents(first("maxPrice")),
    inStock: first("inStock") === "1",
    ...((CATALOG_SORTS as readonly string[]).includes(sort ?? "") && { sort: sort as CatalogSort }),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

/** True when anything beyond the search text, category, sort and page narrows the results. */
export function hasActiveFilters(filters: CatalogFilters): boolean {
  return (
    filters.brands.length > 0 ||
    Object.keys(filters.values).length > 0 ||
    Object.keys(filters.ranges).length > 0 ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.inStock
  );
}
