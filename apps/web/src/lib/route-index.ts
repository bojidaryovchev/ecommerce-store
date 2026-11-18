import { db, schema } from "@ecommerce/database";
import { eq, isNotNull, isNull } from "drizzle-orm";
import { CATALOG_PAGE_SIZE } from "./catalog-filters";

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
  /** Category slug → its canonical path, "/termopompi/monoblok". */
  categoryPaths: Map<string, string>;
  rootSlugs: Set<string>;
  loadedAt: number;
};

const LIFETIME_MS = 60_000;
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
    db.select({ categoryId: schema.products.categoryId }).from(schema.products).where(eq(schema.products.active, true)),
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
  // Each live product counts toward its category and every ancestor.
  const counts = new Map<string, number>();
  for (const { categoryId } of live) {
    let node = categoryId ? byId.get(categoryId) : undefined;
    for (let depth = 0; node && depth < 10; depth++) {
      counts.set(node.slug, (counts.get(node.slug) ?? 0) + 1);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
  }
  return {
    products: new Set(products.map((product) => product.slug!)),
    productSlugById: new Map(products.map((product) => [product.id, product.slug!])),
    productCounts: counts,
    categoryPaths,
    rootSlugs: new Set(categories.filter((category) => !category.parentId).map((category) => category.slug)),
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

export type CatalogVerdict = { kind: "ok" } | { kind: "missing" } | { kind: "moved"; to: string };

/** A path segment as text; a broken escape ("%C3") is no page at all. */
const decode = (segment: string): string | null => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
};

/**
 * What a storefront path (without the locale prefix) is: fine, a catalog page that doesn't exist, or a
 * page that moved. Only paths that are certainly catalog paths are judged (a product URL, the old
 * /products/{id} and /categories/{slug} URLs, or one starting with a top-level category), so a page
 * added later is never refused here; anything else renders as usual. A plain listing page past its
 * last page is missing too (filtered views are left to render: they're noindexed). If the database
 * can't be reached, every path is fine.
 */
export async function catalogVerdict(path: string, search?: URLSearchParams): Promise<CatalogVerdict> {
  const raw = path.split("/").filter(Boolean);
  if (raw.length === 0) return { kind: "ok" };
  const segments = raw.map(decode);
  if (segments.some((segment) => segment === null)) return { kind: "missing" };
  const parts = segments as string[];

  let index: RouteIndex;
  try {
    index = await routeIndex();
  } catch (error) {
    console.error("[route-index] Not loaded; letting the request through:", error);
    return { kind: "ok" };
  }

  if (parts[0] === "produkt") {
    return parts.length === 2 && index.products.has(parts[1]!) ? { kind: "ok" } : { kind: "missing" };
  }
  // Old URLs from before slugs and nested category paths: a real redirect, not a page that redirects.
  if (parts[0] === "products" && parts.length === 2) {
    const slug = index.productSlugById.get(parts[1]!);
    return slug ? { kind: "moved", to: `/produkt/${slug}` } : { kind: "missing" };
  }
  if (parts[0] === "categories" && parts.length === 2) {
    const to = index.categoryPaths.get(parts[1]!);
    return to ? { kind: "moved", to } : { kind: "missing" };
  }

  const last = parts[parts.length - 1]!;
  const canonical = index.categoryPaths.get(last);
  const startsInCatalog = index.rootSlugs.has(parts[0]!);
  if (startsInCatalog || (parts.length === 1 && canonical)) {
    if (!canonical) return { kind: "missing" };
    if (canonical !== `/${parts.join("/")}`) return { kind: "moved", to: canonical };
    if (search && [...search.keys()].every((key) => key === "page")) {
      const page = Number(search.get("page") ?? "1");
      const pages = Math.max(1, Math.ceil((index.productCounts.get(last) ?? 0) / CATALOG_PAGE_SIZE));
      if (!Number.isInteger(page) || page < 1 || page > pages) return { kind: "missing" };
    }
  }
  return { kind: "ok" };
}
