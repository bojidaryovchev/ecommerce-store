import { db, schema } from "@ecommerce/database";
import { isNotNull, isNull } from "drizzle-orm";

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
  /** Category slug → its canonical path, "/termopompi/monoblok". */
  categoryPaths: Map<string, string>;
  rootSlugs: Set<string>;
  loadedAt: number;
};

const LIFETIME_MS = 60_000;
let current: RouteIndex | null = null;
let loading: Promise<RouteIndex> | null = null;

async function load(): Promise<RouteIndex> {
  const [products, categories] = await Promise.all([
    db.select({ slug: schema.products.slug }).from(schema.products).where(isNotNull(schema.products.slug)),
    db
      .select({ id: schema.categories.id, slug: schema.categories.slug, parentId: schema.categories.parentId })
      .from(schema.categories)
      .where(isNull(schema.categories.deletedAt)),
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
  return {
    products: new Set(products.map((product) => product.slug!)),
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

/**
 * What a storefront path (without the locale prefix) is: fine, a catalog page that doesn't exist, or a
 * category reached by an outdated path. Only paths that are certainly catalog paths are judged (a
 * product URL, or one starting with a top-level category), so a page added later is never refused
 * here; anything else renders as usual. If the database can't be reached, every path is fine.
 */
export async function catalogVerdict(path: string): Promise<CatalogVerdict> {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) return { kind: "ok" };
  let index: RouteIndex;
  try {
    index = await routeIndex();
  } catch (error) {
    console.error("[route-index] Not loaded; letting the request through:", error);
    return { kind: "ok" };
  }

  if (segments[0] === "produkt") {
    return segments.length === 2 && index.products.has(decodeURIComponent(segments[1]!))
      ? { kind: "ok" }
      : { kind: "missing" };
  }

  const last = decodeURIComponent(segments[segments.length - 1]!);
  const canonical = index.categoryPaths.get(last);
  const startsInCatalog = index.rootSlugs.has(decodeURIComponent(segments[0]!));
  if (startsInCatalog || (segments.length === 1 && canonical)) {
    if (!canonical) return { kind: "missing" };
    return canonical === `/${segments.map(decodeURIComponent).join("/")}`
      ? { kind: "ok" }
      : { kind: "moved", to: canonical };
  }
  return { kind: "ok" };
}
