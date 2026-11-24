import { GUIDES } from "@/content/guides";
import { TOOLS } from "@/lib/calculators";
import { INSTALLATION_SYSTEMS } from "@/lib/installation-systems";

/**
 * The storefront's pages outside the catalogue, by first path segment, and the child segments each one
 * accepts. The proxy answers 404 for every storefront path that is neither here nor a catalogue path
 * (lib/route-index.ts), because with Cache Components a page commits to 200 as soon as its shell streams
 * and its own notFound() can no longer change the status (Google: a missing page must return 404, not
 * 200 with an error message).
 *
 * - `leaf`: the page has no child paths.
 * - a set: exactly these children (a guide's slug, a calculator, an installation system).
 * - `any`: children aren't judged here (signed-in pages, and checkout, which robots.txt disallows).
 *
 * Adding a route under app/[locale]/? Add its first segment here, or the proxy answers 404 for it.
 * Product and category paths, and the old /products and /categories URLs, are judged in route-index.ts.
 */
type Children = "leaf" | "any" | ReadonlySet<string>;

// A Map, not an object literal: a path like /constructor must not find an inherited property.
export const STOREFRONT_PAGES: ReadonlyMap<string, Children> = new Map<string, Children>([
  ["account", "any"],
  ["biskvitki", "leaf"],
  ["checkout", "any"],
  ["dostavka", "leaf"],
  ["forgot-password", "leaf"],
  ["garantsiya", "leaf"],
  ["kalkulatori", new Set<string>(TOOLS)],
  ["kategorii", "leaf"],
  ["kontakti", "leaf"],
  ["login", "leaf"],
  ["montazh", new Set(INSTALLATION_SYSTEMS.map((system) => system.slug))],
  ["obshti-usloviya", "leaf"],
  ["poveritelnost", "leaf"],
  ["produkti", "leaf"],
  ["register", "leaf"],
  ["reset-password", "leaf"],
  ["saveti", new Set(GUIDES.map((guide) => guide.slug))],
  ["sravnenie", "leaf"],
  ["verify-email", "leaf"],
  ["vrashtane", new Set(["otkaz"])],
  ["za-nas", "leaf"],
]);

/** Whether a storefront path (decoded segments, without the locale) is one of the pages above; null if it's not theirs to judge. */
export function storefrontPageExists(parts: readonly string[]): boolean | null {
  const children = STOREFRONT_PAGES.get(parts[0] ?? "");
  if (children === undefined) return null;
  if (parts.length === 1 || children === "any") return true;
  if (children === "leaf") return false;
  return parts.length === 2 && children.has(parts[1]!);
}
