import { routing } from "@/i18n/routing";
import { db, schema } from "@ecommerce/database";
import { eq, isNotNull, isNull } from "drizzle-orm";
import { CATALOG_PAGE_SIZE, joinBrands, queryString, splitBrands } from "./catalog-filters";
import { storefrontPageExists } from "./storefront-routes";

/**
 * Which catalog URLs exist, for the proxy to answer before the page renders. With Cache Components
 * the page commits to 200 as soon as its shell streams, so a missing product or category can only be
 * a real 404 (and an outdated path a real 308) if it is decided here first. Held in memory for a
 * minute per server instance: two small queries, and a product published in the admin is reachable
 * within a minute.
 */
type RouteIndex = {
  /** Every product slug (unpublished products still have a page saying they're unavailable). */
  products: Set<string>;
  /** Product id → slug, for the old /products/{id} URLs. */
  productSlugById: Map<string, string>;
  /** Category slug → live products in it and below it, for listing pages past the end. */
  productCounts: Map<string, number>;
  /** Category slug → brand → live products of that brand in it and below it, for brand-filtered listings. */
  brandCounts: Map<string, Map<string, number>>;
  /** Category slug → its canonical path, "/termopompi/monoblok". */
  categoryPaths: Map<string, string>;
  loadedAt: number;
};

const LIFETIME_MS = 60_000;
/** The counts' key for the whole catalogue (no category slug contains a space). */
const ALL_PRODUCTS = "all products";
let current: RouteIndex | null = null;
let loading: Promise<RouteIndex> | null = null;

async function load(): Promise<RouteIndex> {
  const [products, categories, live] = await Promise.all([
    db
      .select({ id: schema.products.id, slug: schema.products.slug })
      .from(schema.products)
      .where(isNotNull(schema.products.slug)),
    db
      .select({ id: schema.categories.id, slug: schema.categories.slug, parentId: schema.categories.parentId })
      .from(schema.categories)
      .where(isNull(schema.categories.deletedAt)),
    db
      .select({ categoryId: schema.products.categoryId, brand: schema.products.brand })
      .from(schema.products)
      .where(eq(schema.products.active, true)),
  ]);
  const byId = new Map(categories.map((category) => [category.id, category]));
  const pathOf = (id: string): string | null => {
    const trail: string[] = [];
    let node = byId.get(id);
    for (let depth = 0; node && depth < 10; depth++) {
      trail.unshift(node.slug);
      if (!node.parentId) return `/${trail.join("/")}`;
      node = byId.get(node.parentId);
    }
    // A parent that is gone: the category is not reachable.
    return null;
  };
  const categoryPaths = new Map<string, string>();
  for (const category of categories) {
    const path = pathOf(category.id);
    if (path) categoryPaths.set(category.slug, path);
  }
  // Each live product counts toward its category and every ancestor, and toward the whole catalogue
  // (ALL_PRODUCTS, the /produkti listing), overall and for its brand.
  const counts = new Map<string, number>();
  const brandCounts = new Map<string, Map<string, number>>();
  const add = (key: string, brand: string | null) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!brand) return;
    const brands = brandCounts.get(key) ?? new Map<string, number>();
    brands.set(brand, (brands.get(brand) ?? 0) + 1);
    brandCounts.set(key, brands);
  };
  for (const { categoryId, brand } of live) {
    add(ALL_PRODUCTS, brand);
    let node = categoryId ? byId.get(categoryId) : undefined;
    for (let depth = 0; node && depth < 10; depth++) {
      add(node.slug, brand);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
  }
  return {
    products: new Set(products.map((product) => product.slug!)),
    productSlugById: new Map(products.map((product) => [product.id, product.slug!])),
    productCounts: counts,
    brandCounts,
    categoryPaths,
    loadedAt: Date.now(),
  };
}

async function routeIndex(): Promise<RouteIndex> {
  if (current && Date.now() - current.loadedAt < LIFETIME_MS) return current;
  loading ??= load()
    .then((index) => (current = index))
    .finally(() => (loading = null));
  return loading;
}

/** `search`, when set, replaces the request's query on the redirect (a normalized filter). */
export type CatalogVerdict = { kind: "ok" } | { kind: "missing" } | { kind: "moved"; to: string; search?: string };

/** A path segment as text; a broken escape ("%C3") is no page at all. */
const decode = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

/**
 * What a storefront path (without the locale prefix) is: fine, a page that doesn't exist, or a page that
 * moved. The storefront's own pages are listed in storefront-routes.ts; everything else is a catalog path
 * (a product, a category path, the old /products/{id} and /categories/{slug} URLs) or doesn't exist.
 * A listing past its last page is missing, and so is a brand filter naming a brand the section doesn't
 * carry or the same brand twice (other filters are disallowed in robots.txt and left to render: they're
 * noindexed). If the database can't be reached, every path is fine.
 */
export async function catalogVerdict(path: string, search?: URLSearchParams): Promise<CatalogVerdict> {
  const raw = path.split("/").filter(Boolean);
  if (raw.length === 0) return { kind: "ok" };
  const segments = raw.map(decode);
  if (segments.some((segment) => segment === null)) return { kind: "missing" };

  let index: RouteIndex;
  try {
    index = await routeIndex();
  } catch (error) {
    console.error("[route-index] Not loaded; letting the request through:", error);
    return { kind: "ok" };
  }
  return judgePath(segments as string[], search ?? new URLSearchParams(), index);
}

const OK: CatalogVerdict = { kind: "ok" };
const MISSING: CatalogVerdict = { kind: "missing" };

/** The verdict for decoded path segments, given the index; separate from loading so it can be checked with a made-up index. */
export function judgePath(
  parts: readonly string[],
  search: URLSearchParams,
  index: Pick<RouteIndex, "products" | "productSlugById" | "productCounts" | "brandCounts" | "categoryPaths">,
): CatalogVerdict {
  // The default locale's prefix (/bg/...) is redirected away by the proxy and next-intl.
  if (parts[0] === routing.defaultLocale) return OK;

  if (parts[0] === "produkt") return parts.length === 2 && index.products.has(parts[1]!) ? OK : MISSING;
  // Old URLs from before slugs, nested category paths and the Bulgarian listing paths: a real redirect,
  // not a page that redirects (next.config.ts redirects the bare listings too, without the database).
  if (parts[0] === "products" || parts[0] === "categories") {
    if (parts.length === 1) return { kind: "moved", to: parts[0] === "products" ? "/produkti" : "/kategorii" };
    if (parts.length > 2) return MISSING;
    const productSlug = parts[0] === "products" ? index.productSlugById.get(parts[1]!) : undefined;
    const to = parts[0] === "products" ? productSlug && `/produkt/${productSlug}` : index.categoryPaths.get(parts[1]!);
    return to ? { kind: "moved", to } : MISSING;
  }

  // The whole catalogue's listing takes the same brand and page checks as a category's.
  if (parts.length === 1 && parts[0] === "produkti") return judgeListing(ALL_PRODUCTS, "/produkti", search, index);

  const page = storefrontPageExists(parts);
  if (page !== null) return page ? OK : MISSING;

  // Anything else is a category path or nothing at all.
  const last = parts[parts.length - 1]!;
  const canonical = index.categoryPaths.get(last);
  if (!canonical) return MISSING;
  if (canonical !== `/${parts.join("/")}`) return { kind: "moved", to: canonical };
  return judgeListing(last, canonical, search, index);
}

/**
 * A plain or brand-filtered listing (the crawlable views): the brands must be carried here, each named
 * once, and the page must exist. One selection has one URL: brands in a single `brand` parameter, in a
 * fixed order (lib/catalog-filters.ts); any other spelling of it redirects there. Other filters are
 * disallowed in robots.txt and render noindexed, so they aren't judged.
 */
function judgeListing(
  key: string,
  path: string,
  search: URLSearchParams,
  index: Pick<RouteIndex, "productCounts" | "brandCounts">,
): CatalogVerdict {
  if (![...search.keys()].every((name) => name === "page" || name === "brand")) return OK;
  const brandParams = search.getAll("brand");
  const brands = splitBrands(brandParams);
  const carried = index.brandCounts.get(key);
  if (brandParams.length > 0 && brands.length === 0) return MISSING;
  if (new Set(brands).size !== brands.length) return MISSING;
  if (brands.some((brand) => !carried?.has(brand))) return MISSING;
  if (brands.length > 0 && (brandParams.length > 1 || brandParams[0] !== joinBrands(brands))) {
    const normalized = new URLSearchParams(search);
    normalized.set("brand", joinBrands(brands));
    return { kind: "moved", to: path, search: `?${queryString(normalized)}` };
  }
  const products = brands.length
    ? brands.reduce((sum, brand) => sum + (carried?.get(brand) ?? 0), 0)
    : (index.productCounts.get(key) ?? 0);
  const pageParams = search.getAll("page");
  if (pageParams.length > 1) return MISSING;
  const pageNumber = Number(pageParams[0] ?? "1");
  const pages = Math.max(1, Math.ceil(products / CATALOG_PAGE_SIZE));
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > pages) return MISSING;
  return OK;
}
